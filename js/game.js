( function () {

	class GLTFLoader extends THREE.Loader {

		constructor( manager ) {

			super( manager );
			this.dracoLoader = null;
			this.ktx2Loader = null;
			this.meshoptDecoder = null;
			this.pluginCallbacks = [];
			this.register( function ( parser ) {

				return new GLTFMaterialsClearcoatExtension( parser );

			} );
			this.register( function ( parser ) {

				return new GLTFTextureBasisUExtension( parser );

			} );
			this.register( function ( parser ) {

				return new GLTFTextureWebPExtension( parser );

			} );
			this.register( function ( parser ) {

				return new GLTFMaterialsTransmissionExtension( parser );

			} );
			this.register( function ( parser ) {

				return new GLTFLightsExtension( parser );

			} );
			this.register( function ( parser ) {

				return new GLTFMeshoptCompression( parser );

			} );

		}

		load( url, onLoad, onProgress, onError ) {

			const scope = this;
			let resourcePath;

			if ( this.resourcePath !== '' ) {

				resourcePath = this.resourcePath;

			} else if ( this.path !== '' ) {

				resourcePath = this.path;

			} else {

				resourcePath = THREE.LoaderUtils.extractUrlBase( url );

			} // Tells the LoadingManager to track an extra item, which resolves after
			// the model is fully loaded. This means the count of items loaded will
			// be incorrect, but ensures manager.onLoad() does not fire early.


			this.manager.itemStart( url );

			const _onError = function ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );
				scope.manager.itemEnd( url );

			};

			const loader = new THREE.FileLoader( this.manager );
			loader.setPath( this.path );
			loader.setResponseType( 'arraybuffer' );
			loader.setRequestHeader( this.requestHeader );
			loader.setWithCredentials( this.withCredentials );
			loader.load( url, function ( data ) {

				try {

					scope.parse( data, resourcePath, function ( gltf ) {

						onLoad( gltf );
						scope.manager.itemEnd( url );

					}, _onError );

				} catch ( e ) {

					_onError( e );

				}

			}, onProgress, _onError );

		}

		setDRACOLoader( dracoLoader ) {

			this.dracoLoader = dracoLoader;
			return this;

		}

		setDDSLoader() {

			throw new Error( 'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".' );

		}

		setKTX2Loader( ktx2Loader ) {

			this.ktx2Loader = ktx2Loader;
			return this;

		}

		setMeshoptDecoder( meshoptDecoder ) {

			this.meshoptDecoder = meshoptDecoder;
			return this;

		}

		register( callback ) {

			if ( this.pluginCallbacks.indexOf( callback ) === - 1 ) {

				this.pluginCallbacks.push( callback );

			}

			return this;

		}

		unregister( callback ) {

			if ( this.pluginCallbacks.indexOf( callback ) !== - 1 ) {

				this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

			}

			return this;

		}

		parse( data, path, onLoad, onError ) {

			let content;
			const extensions = {};
			const plugins = {};

			if ( typeof data === 'string' ) {

				content = data;

			} else {

				const magic = THREE.LoaderUtils.decodeText( new Uint8Array( data, 0, 4 ) );

				if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

					try {

						extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

					} catch ( error ) {

						if ( onError ) onError( error );
						return;

					}

					content = extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content;

				} else {

					content = THREE.LoaderUtils.decodeText( new Uint8Array( data ) );

				}

			}

			const json = JSON.parse( content );

			if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

				if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
				return;

			}

			const parser = new GLTFParser( json, {
				path: path || this.resourcePath || '',
				crossOrigin: this.crossOrigin,
				requestHeader: this.requestHeader,
				manager: this.manager,
				ktx2Loader: this.ktx2Loader,
				meshoptDecoder: this.meshoptDecoder
			} );
			parser.fileLoader.setRequestHeader( this.requestHeader );

			for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

				const plugin = this.pluginCallbacks[ i ]( parser );
				plugins[ plugin.name ] = plugin; // Workaround to avoid determining as unknown extension
				// in addUnknownExtensionsToUserData().
				// Remove this workaround if we move all the existing
				// extension handlers to plugin system

				extensions[ plugin.name ] = true;

			}

			if ( json.extensionsUsed ) {

				for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

					const extensionName = json.extensionsUsed[ i ];
					const extensionsRequired = json.extensionsRequired || [];

					switch ( extensionName ) {

						case EXTENSIONS.KHR_MATERIALS_UNLIT:
							extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
							break;

						case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
							extensions[ extensionName ] = new GLTFMaterialsPbrSpecularGlossinessExtension();
							break;

						case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
							extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
							break;

						case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
							extensions[ extensionName ] = new GLTFTextureTransformExtension();
							break;

						case EXTENSIONS.KHR_MESH_QUANTIZATION:
							extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
							break;

						default:
							if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

								console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

							}

					}

				}

			}

			parser.setExtensions( extensions );
			parser.setPlugins( plugins );
			parser.parse( onLoad, onError );

		}

	}
	/* GLTFREGISTRY */


	function GLTFRegistry() {

		let objects = {};
		return {
			get: function ( key ) {

				return objects[ key ];

			},
			add: function ( key, object ) {

				objects[ key ] = object;

			},
			remove: function ( key ) {

				delete objects[ key ];

			},
			removeAll: function () {

				objects = {};

			}
		};

	}
	/*********************************/

	/********** EXTENSIONS ***********/

	/*********************************/


	const EXTENSIONS = {
		KHR_BINARY_GLTF: 'KHR_binary_glTF',
		KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
		KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
		KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
		KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
		KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
		KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
		KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
		KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
		KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
		EXT_TEXTURE_WEBP: 'EXT_texture_webp',
		EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression'
	};
	/**
	 * Punctual Lights Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
	 */

	class GLTFLightsExtension {

		constructor( parser ) {

			this.parser = parser;
			this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL; // THREE.Object3D instance caches

			this.cache = {
				refs: {},
				uses: {}
			};

		}

		_markDefs() {

			const parser = this.parser;
			const nodeDefs = this.parser.json.nodes || [];

			for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

				const nodeDef = nodeDefs[ nodeIndex ];

				if ( nodeDef.extensions && nodeDef.extensions[ this.name ] && nodeDef.extensions[ this.name ].light !== undefined ) {

					parser._addNodeRef( this.cache, nodeDef.extensions[ this.name ].light );

				}

			}

		}

		_loadLight( lightIndex ) {

			const parser = this.parser;
			const cacheKey = 'light:' + lightIndex;
			let dependency = parser.cache.get( cacheKey );
			if ( dependency ) return dependency;
			const json = parser.json;
			const extensions = json.extensions && json.extensions[ this.name ] || {};
			const lightDefs = extensions.lights || [];
			const lightDef = lightDefs[ lightIndex ];
			let lightNode;
			const color = new THREE.Color( 0xffffff );
			if ( lightDef.color !== undefined ) color.fromArray( lightDef.color );
			const range = lightDef.range !== undefined ? lightDef.range : 0;

			switch ( lightDef.type ) {

				case 'directional':
					lightNode = new THREE.DirectionalLight( color );
					lightNode.target.position.set( 0, 0, - 1 );
					lightNode.add( lightNode.target );
					break;

				case 'point':
					lightNode = new THREE.PointLight( color );
					lightNode.distance = range;
					break;

				case 'spot':
					lightNode = new THREE.SpotLight( color );
					lightNode.distance = range; // Handle spotlight properties.

					lightDef.spot = lightDef.spot || {};
					lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
					lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
					lightNode.angle = lightDef.spot.outerConeAngle;
					lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
					lightNode.target.position.set( 0, 0, - 1 );
					lightNode.add( lightNode.target );
					break;

				default:
					throw new Error( 'THREE.GLTFLoader: Unexpected light type: ' + lightDef.type );

			} // Some lights (e.g. spot) default to a position other than the origin. Reset the position
			// here, because node-level parsing will only override position if explicitly specified.


			lightNode.position.set( 0, 0, 0 );
			lightNode.decay = 2;
			if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;
			lightNode.name = parser.createUniqueName( lightDef.name || 'light_' + lightIndex );
			dependency = Promise.resolve( lightNode );
			parser.cache.add( cacheKey, dependency );
			return dependency;

		}

		createNodeAttachment( nodeIndex ) {

			const self = this;
			const parser = this.parser;
			const json = parser.json;
			const nodeDef = json.nodes[ nodeIndex ];
			const lightDef = nodeDef.extensions && nodeDef.extensions[ this.name ] || {};
			const lightIndex = lightDef.light;
			if ( lightIndex === undefined ) return null;
			return this._loadLight( lightIndex ).then( function ( light ) {

				return parser._getNodeRef( self.cache, lightIndex, light );

			} );

		}

	}
	/**
	 * Unlit Materials Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
	 */


	class GLTFMaterialsUnlitExtension {

		constructor() {

			this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

		}

		getMaterialType() {

			return THREE.MeshBasicMaterial;

		}

		extendParams( materialParams, materialDef, parser ) {

			const pending = [];
			materialParams.color = new THREE.Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;
			const metallicRoughness = materialDef.pbrMetallicRoughness;

			if ( metallicRoughness ) {

				if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

					const array = metallicRoughness.baseColorFactor;
					materialParams.color.fromArray( array );
					materialParams.opacity = array[ 3 ];

				}

				if ( metallicRoughness.baseColorTexture !== undefined ) {

					pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );

				}

			}

			return Promise.all( pending );

		}

	}
	/**
	 * Clearcoat Materials Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
	 */


	class GLTFMaterialsClearcoatExtension {

		constructor( parser ) {

			this.parser = parser;
			this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

		}

		getMaterialType( materialIndex ) {

			const parser = this.parser;
			const materialDef = parser.json.materials[ materialIndex ];
			if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;
			return THREE.MeshPhysicalMaterial;

		}

		extendMaterialParams( materialIndex, materialParams ) {

			const parser = this.parser;
			const materialDef = parser.json.materials[ materialIndex ];

			if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

				return Promise.resolve();

			}

			const pending = [];
			const extension = materialDef.extensions[ this.name ];

			if ( extension.clearcoatFactor !== undefined ) {

				materialParams.clearcoat = extension.clearcoatFactor;

			}

			if ( extension.clearcoatTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'clearcoatMap', extension.clearcoatTexture ) );

			}

			if ( extension.clearcoatRoughnessFactor !== undefined ) {

				materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;

			}

			if ( extension.clearcoatRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture ) );

			}

			if ( extension.clearcoatNormalTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture ) );

				if ( extension.clearcoatNormalTexture.scale !== undefined ) {

					const scale = extension.clearcoatNormalTexture.scale; // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995

					materialParams.clearcoatNormalScale = new THREE.Vector2( scale, - scale );

				}

			}

			return Promise.all( pending );

		}

	}
	/**
	 * Transmission Materials Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
	 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
	 */


	class GLTFMaterialsTransmissionExtension {

		constructor( parser ) {

			this.parser = parser;
			this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

		}

		getMaterialType( materialIndex ) {

			const parser = this.parser;
			const materialDef = parser.json.materials[ materialIndex ];
			if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;
			return THREE.MeshPhysicalMaterial;

		}

		extendMaterialParams( materialIndex, materialParams ) {

			const parser = this.parser;
			const materialDef = parser.json.materials[ materialIndex ];

			if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

				return Promise.resolve();

			}

			const pending = [];
			const extension = materialDef.extensions[ this.name ];

			if ( extension.transmissionFactor !== undefined ) {

				materialParams.transmission = extension.transmissionFactor;

			}

			if ( extension.transmissionTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'transmissionMap', extension.transmissionTexture ) );

			}

			return Promise.all( pending );

		}

	}
	/**
	 * BasisU Texture Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
	 */


	class GLTFTextureBasisUExtension {

		constructor( parser ) {

			this.parser = parser;
			this.name = EXTENSIONS.KHR_TEXTURE_BASISU;

		}

		loadTexture( textureIndex ) {

			const parser = this.parser;
			const json = parser.json;
			const textureDef = json.textures[ textureIndex ];

			if ( ! textureDef.extensions || ! textureDef.extensions[ this.name ] ) {

				return null;

			}

			const extension = textureDef.extensions[ this.name ];
			const source = json.images[ extension.source ];
			const loader = parser.options.ktx2Loader;

			if ( ! loader ) {

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures' );

				} else {

					// Assumes that the extension is optional and that a fallback texture is present
					return null;

				}

			}

			return parser.loadTextureImage( textureIndex, source, loader );

		}

	}
	/**
	 * WebP Texture Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
	 */


	class GLTFTextureWebPExtension {

		constructor( parser ) {

			this.parser = parser;
			this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
			this.isSupported = null;

		}

		loadTexture( textureIndex ) {

			const name = this.name;
			const parser = this.parser;
			const json = parser.json;
			const textureDef = json.textures[ textureIndex ];

			if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

				return null;

			}

			const extension = textureDef.extensions[ name ];
			const source = json.images[ extension.source ];
			let loader = parser.textureLoader;

			if ( source.uri ) {

				const handler = parser.options.manager.getHandler( source.uri );
				if ( handler !== null ) loader = handler;

			}

			return this.detectSupport().then( function ( isSupported ) {

				if ( isSupported ) return parser.loadTextureImage( textureIndex, source, loader );

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: WebP required by asset but unsupported.' );

				} // Fall back to PNG or JPEG.


				return parser.loadTexture( textureIndex );

			} );

		}

		detectSupport() {

			if ( ! this.isSupported ) {

				this.isSupported = new Promise( function ( resolve ) {

					const image = new Image(); // Lossy test image. Support for lossy images doesn't guarantee support for all
					// WebP images, unfortunately.

					image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

					image.onload = image.onerror = function () {

						resolve( image.height === 1 );

					};

				} );

			}

			return this.isSupported;

		}

	}
	/**
	* meshopt BufferView Compression Extension
	*
	* Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
	*/


	class GLTFMeshoptCompression {

		constructor( parser ) {

			this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
			this.parser = parser;

		}

		loadBufferView( index ) {

			const json = this.parser.json;
			const bufferView = json.bufferViews[ index ];

			if ( bufferView.extensions && bufferView.extensions[ this.name ] ) {

				const extensionDef = bufferView.extensions[ this.name ];
				const buffer = this.parser.getDependency( 'buffer', extensionDef.buffer );
				const decoder = this.parser.options.meshoptDecoder;

				if ( ! decoder || ! decoder.supported ) {

					if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

						throw new Error( 'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files' );

					} else {

						// Assumes that the extension is optional and that fallback buffer data is present
						return null;

					}

				}

				return Promise.all( [ buffer, decoder.ready ] ).then( function ( res ) {

					const byteOffset = extensionDef.byteOffset || 0;
					const byteLength = extensionDef.byteLength || 0;
					const count = extensionDef.count;
					const stride = extensionDef.byteStride;
					const result = new ArrayBuffer( count * stride );
					const source = new Uint8Array( res[ 0 ], byteOffset, byteLength );
					decoder.decodeGltfBuffer( new Uint8Array( result ), count, stride, source, extensionDef.mode, extensionDef.filter );
					return result;

				} );

			} else {

				return null;

			}

		}

	}
	/* BINARY EXTENSION */


	const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
	const BINARY_EXTENSION_HEADER_LENGTH = 12;
	const BINARY_EXTENSION_CHUNK_TYPES = {
		JSON: 0x4E4F534A,
		BIN: 0x004E4942
	};

	class GLTFBinaryExtension {

		constructor( data ) {

			this.name = EXTENSIONS.KHR_BINARY_GLTF;
			this.content = null;
			this.body = null;
			const headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );
			this.header = {
				magic: THREE.LoaderUtils.decodeText( new Uint8Array( data.slice( 0, 4 ) ) ),
				version: headerView.getUint32( 4, true ),
				length: headerView.getUint32( 8, true )
			};

			if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

				throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

			} else if ( this.header.version < 2.0 ) {

				throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

			}

			const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
			const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
			let chunkIndex = 0;

			while ( chunkIndex < chunkContentsLength ) {

				const chunkLength = chunkView.getUint32( chunkIndex, true );
				chunkIndex += 4;
				const chunkType = chunkView.getUint32( chunkIndex, true );
				chunkIndex += 4;

				if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

					const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
					this.content = THREE.LoaderUtils.decodeText( contentArray );

				} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

					const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
					this.body = data.slice( byteOffset, byteOffset + chunkLength );

				} // Clients must ignore chunks with unknown types.


				chunkIndex += chunkLength;

			}

			if ( this.content === null ) {

				throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

			}

		}

	}
	/**
	 * DRACO THREE.Mesh Compression Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
	 */


	class GLTFDracoMeshCompressionExtension {

		constructor( json, dracoLoader ) {

			if ( ! dracoLoader ) {

				throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

			}

			this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
			this.json = json;
			this.dracoLoader = dracoLoader;
			this.dracoLoader.preload();

		}

		decodePrimitive( primitive, parser ) {

			const json = this.json;
			const dracoLoader = this.dracoLoader;
			const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
			const gltfAttributeMap = primitive.extensions[ this.name ].attributes;
			const threeAttributeMap = {};
			const attributeNormalizedMap = {};
			const attributeTypeMap = {};

			for ( const attributeName in gltfAttributeMap ) {

				const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();
				threeAttributeMap[ threeAttributeName ] = gltfAttributeMap[ attributeName ];

			}

			for ( const attributeName in primitive.attributes ) {

				const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

				if ( gltfAttributeMap[ attributeName ] !== undefined ) {

					const accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
					const componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];
					attributeTypeMap[ threeAttributeName ] = componentType;
					attributeNormalizedMap[ threeAttributeName ] = accessorDef.normalized === true;

				}

			}

			return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

				return new Promise( function ( resolve ) {

					dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

						for ( const attributeName in geometry.attributes ) {

							const attribute = geometry.attributes[ attributeName ];
							const normalized = attributeNormalizedMap[ attributeName ];
							if ( normalized !== undefined ) attribute.normalized = normalized;

						}

						resolve( geometry );

					}, threeAttributeMap, attributeTypeMap );

				} );

			} );

		}

	}
	/**
	 * Texture Transform Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
	 */


	class GLTFTextureTransformExtension {

		constructor() {

			this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

		}

		extendTexture( texture, transform ) {

			texture = texture.clone();

			if ( transform.offset !== undefined ) {

				texture.offset.fromArray( transform.offset );

			}

			if ( transform.rotation !== undefined ) {

				texture.rotation = transform.rotation;

			}

			if ( transform.scale !== undefined ) {

				texture.repeat.fromArray( transform.scale );

			}

			if ( transform.texCoord !== undefined ) {

				console.warn( 'THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );

			}

			texture.needsUpdate = true;
			return texture;

		}

	}
	/**
	 * Specular-Glossiness Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
	 */

	/**
	 * A sub class of StandardMaterial with some of the functionality
	 * changed via the `onBeforeCompile` callback
	 * @pailhead
	 */


	class GLTFMeshStandardSGMaterial extends THREE.MeshStandardMaterial {

		constructor( params ) {

			super();
			this.isGLTFSpecularGlossinessMaterial = true; //various chunks that need replacing

			const specularMapParsFragmentChunk = [ '#ifdef USE_SPECULARMAP', '	uniform sampler2D specularMap;', '#endif' ].join( '\n' );
			const glossinessMapParsFragmentChunk = [ '#ifdef USE_GLOSSINESSMAP', '	uniform sampler2D glossinessMap;', '#endif' ].join( '\n' );
			const specularMapFragmentChunk = [ 'vec3 specularFactor = specular;', '#ifdef USE_SPECULARMAP', '	vec4 texelSpecular = texture2D( specularMap, vUv );', '	texelSpecular = sRGBToLinear( texelSpecular );', '	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture', '	specularFactor *= texelSpecular.rgb;', '#endif' ].join( '\n' );
			const glossinessMapFragmentChunk = [ 'float glossinessFactor = glossiness;', '#ifdef USE_GLOSSINESSMAP', '	vec4 texelGlossiness = texture2D( glossinessMap, vUv );', '	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture', '	glossinessFactor *= texelGlossiness.a;', '#endif' ].join( '\n' );
			const lightPhysicalFragmentChunk = [ 'PhysicalMaterial material;', 'material.diffuseColor = diffuseColor.rgb * ( 1. - max( specularFactor.r, max( specularFactor.g, specularFactor.b ) ) );', 'vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );', 'float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );', 'material.specularRoughness = max( 1.0 - glossinessFactor, 0.0525 ); // 0.0525 corresponds to the base mip of a 256 cubemap.', 'material.specularRoughness += geometryRoughness;', 'material.specularRoughness = min( material.specularRoughness, 1.0 );', 'material.specularColor = specularFactor;' ].join( '\n' );
			const uniforms = {
				specular: {
					value: new THREE.Color().setHex( 0xffffff )
				},
				glossiness: {
					value: 1
				},
				specularMap: {
					value: null
				},
				glossinessMap: {
					value: null
				}
			};
			this._extraUniforms = uniforms;

			this.onBeforeCompile = function ( shader ) {

				for ( const uniformName in uniforms ) {

					shader.uniforms[ uniformName ] = uniforms[ uniformName ];

				}

				shader.fragmentShader = shader.fragmentShader.replace( 'uniform float roughness;', 'uniform vec3 specular;' ).replace( 'uniform float metalness;', 'uniform float glossiness;' ).replace( '#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk ).replace( '#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk ).replace( '#include <roughnessmap_fragment>', specularMapFragmentChunk ).replace( '#include <metalnessmap_fragment>', glossinessMapFragmentChunk ).replace( '#include <lights_physical_fragment>', lightPhysicalFragmentChunk );

			};

			Object.defineProperties( this, {
				specular: {
					get: function () {

						return uniforms.specular.value;

					},
					set: function ( v ) {

						uniforms.specular.value = v;

					}
				},
				specularMap: {
					get: function () {

						return uniforms.specularMap.value;

					},
					set: function ( v ) {

						uniforms.specularMap.value = v;

						if ( v ) {

							this.defines.USE_SPECULARMAP = ''; // USE_UV is set by the renderer for specular maps

						} else {

							delete this.defines.USE_SPECULARMAP;

						}

					}
				},
				glossiness: {
					get: function () {

						return uniforms.glossiness.value;

					},
					set: function ( v ) {

						uniforms.glossiness.value = v;

					}
				},
				glossinessMap: {
					get: function () {

						return uniforms.glossinessMap.value;

					},
					set: function ( v ) {

						uniforms.glossinessMap.value = v;

						if ( v ) {

							this.defines.USE_GLOSSINESSMAP = '';
							this.defines.USE_UV = '';

						} else {

							delete this.defines.USE_GLOSSINESSMAP;
							delete this.defines.USE_UV;

						}

					}
				}
			} );
			delete this.metalness;
			delete this.roughness;
			delete this.metalnessMap;
			delete this.roughnessMap;
			this.setValues( params );

		}

		copy( source ) {

			super.copy( source );
			this.specularMap = source.specularMap;
			this.specular.copy( source.specular );
			this.glossinessMap = source.glossinessMap;
			this.glossiness = source.glossiness;
			delete this.metalness;
			delete this.roughness;
			delete this.metalnessMap;
			delete this.roughnessMap;
			return this;

		}

	}

	class GLTFMaterialsPbrSpecularGlossinessExtension {

		constructor() {

			this.name = EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS;
			this.specularGlossinessParams = [ 'color', 'map', 'lightMap', 'lightMapIntensity', 'aoMap', 'aoMapIntensity', 'emissive', 'emissiveIntensity', 'emissiveMap', 'bumpMap', 'bumpScale', 'normalMap', 'normalMapType', 'displacementMap', 'displacementScale', 'displacementBias', 'specularMap', 'specular', 'glossinessMap', 'glossiness', 'alphaMap', 'envMap', 'envMapIntensity', 'refractionRatio' ];

		}

		getMaterialType() {

			return GLTFMeshStandardSGMaterial;

		}

		extendParams( materialParams, materialDef, parser ) {

			const pbrSpecularGlossiness = materialDef.extensions[ this.name ];
			materialParams.color = new THREE.Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;
			const pending = [];

			if ( Array.isArray( pbrSpecularGlossiness.diffuseFactor ) ) {

				const array = pbrSpecularGlossiness.diffuseFactor;
				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( pbrSpecularGlossiness.diffuseTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', pbrSpecularGlossiness.diffuseTexture ) );

			}

			materialParams.emissive = new THREE.Color( 0.0, 0.0, 0.0 );
			materialParams.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
			materialParams.specular = new THREE.Color( 1.0, 1.0, 1.0 );

			if ( Array.isArray( pbrSpecularGlossiness.specularFactor ) ) {

				materialParams.specular.fromArray( pbrSpecularGlossiness.specularFactor );

			}

			if ( pbrSpecularGlossiness.specularGlossinessTexture !== undefined ) {

				const specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
				pending.push( parser.assignTexture( materialParams, 'glossinessMap', specGlossMapDef ) );
				pending.push( parser.assignTexture( materialParams, 'specularMap', specGlossMapDef ) );

			}

			return Promise.all( pending );

		}

		createMaterial( materialParams ) {

			const material = new GLTFMeshStandardSGMaterial( materialParams );
			material.fog = true;
			material.color = materialParams.color;
			material.map = materialParams.map === undefined ? null : materialParams.map;
			material.lightMap = null;
			material.lightMapIntensity = 1.0;
			material.aoMap = materialParams.aoMap === undefined ? null : materialParams.aoMap;
			material.aoMapIntensity = 1.0;
			material.emissive = materialParams.emissive;
			material.emissiveIntensity = 1.0;
			material.emissiveMap = materialParams.emissiveMap === undefined ? null : materialParams.emissiveMap;
			material.bumpMap = materialParams.bumpMap === undefined ? null : materialParams.bumpMap;
			material.bumpScale = 1;
			material.normalMap = materialParams.normalMap === undefined ? null : materialParams.normalMap;
			material.normalMapType = THREE.TangentSpaceNormalMap;
			if ( materialParams.normalScale ) material.normalScale = materialParams.normalScale;
			material.displacementMap = null;
			material.displacementScale = 1;
			material.displacementBias = 0;
			material.specularMap = materialParams.specularMap === undefined ? null : materialParams.specularMap;
			material.specular = materialParams.specular;
			material.glossinessMap = materialParams.glossinessMap === undefined ? null : materialParams.glossinessMap;
			material.glossiness = materialParams.glossiness;
			material.alphaMap = null;
			material.envMap = materialParams.envMap === undefined ? null : materialParams.envMap;
			material.envMapIntensity = 1.0;
			material.refractionRatio = 0.98;
			return material;

		}

	}
	/**
	 * THREE.Mesh Quantization Extension
	 *
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
	 */


	class GLTFMeshQuantizationExtension {

		constructor() {

			this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;

		}

	}
	/*********************************/

	/********** INTERPOLATION ********/

	/*********************************/
	// Spline Interpolation
	// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation


	class GLTFCubicSplineInterpolant extends THREE.Interpolant {

		constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

			super( parameterPositions, sampleValues, sampleSize, resultBuffer );

		}

		copySampleValue_( index ) {

			// Copies a sample value to the result buffer. See description of glTF
			// CUBICSPLINE values layout in interpolate_() function below.
			const result = this.resultBuffer,
				values = this.sampleValues,
				valueSize = this.valueSize,
				offset = index * valueSize * 3 + valueSize;

			for ( let i = 0; i !== valueSize; i ++ ) {

				result[ i ] = values[ offset + i ];

			}

			return result;

		}

	}

	GLTFCubicSplineInterpolant.prototype.beforeStart_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;
	GLTFCubicSplineInterpolant.prototype.afterEnd_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

	GLTFCubicSplineInterpolant.prototype.interpolate_ = function ( i1, t0, t, t1 ) {

		const result = this.resultBuffer;
		const values = this.sampleValues;
		const stride = this.valueSize;
		const stride2 = stride * 2;
		const stride3 = stride * 3;
		const td = t1 - t0;
		const p = ( t - t0 ) / td;
		const pp = p * p;
		const ppp = pp * p;
		const offset1 = i1 * stride3;
		const offset0 = offset1 - stride3;
		const s2 = - 2 * ppp + 3 * pp;
		const s3 = ppp - pp;
		const s0 = 1 - s2;
		const s1 = s3 - pp + p; // Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]

		for ( let i = 0; i !== stride; i ++ ) {

			const p0 = values[ offset0 + i + stride ]; // splineVertex_k

			const m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)

			const p1 = values[ offset1 + i + stride ]; // splineVertex_k+1

			const m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	};
	/*********************************/

	/********** INTERNALS ************/

	/*********************************/

	/* CONSTANTS */


	const WEBGL_CONSTANTS = {
		FLOAT: 5126,
		//FLOAT_MAT2: 35674,
		FLOAT_MAT3: 35675,
		FLOAT_MAT4: 35676,
		FLOAT_VEC2: 35664,
		FLOAT_VEC3: 35665,
		FLOAT_VEC4: 35666,
		LINEAR: 9729,
		REPEAT: 10497,
		SAMPLER_2D: 35678,
		POINTS: 0,
		LINES: 1,
		LINE_LOOP: 2,
		LINE_STRIP: 3,
		TRIANGLES: 4,
		TRIANGLE_STRIP: 5,
		TRIANGLE_FAN: 6,
		UNSIGNED_BYTE: 5121,
		UNSIGNED_SHORT: 5123
	};
	const WEBGL_COMPONENT_TYPES = {
		5120: Int8Array,
		5121: Uint8Array,
		5122: Int16Array,
		5123: Uint16Array,
		5125: Uint32Array,
		5126: Float32Array
	};
	const WEBGL_FILTERS = {
		9728: THREE.NearestFilter,
		9729: THREE.LinearFilter,
		9984: THREE.NearestMipmapNearestFilter,
		9985: THREE.LinearMipmapNearestFilter,
		9986: THREE.NearestMipmapLinearFilter,
		9987: THREE.LinearMipmapLinearFilter
	};
	const WEBGL_WRAPPINGS = {
		33071: THREE.ClampToEdgeWrapping,
		33648: THREE.MirroredRepeatWrapping,
		10497: THREE.RepeatWrapping
	};
	const WEBGL_TYPE_SIZES = {
		'SCALAR': 1,
		'VEC2': 2,
		'VEC3': 3,
		'VEC4': 4,
		'MAT2': 4,
		'MAT3': 9,
		'MAT4': 16
	};
	const ATTRIBUTES = {
		POSITION: 'position',
		NORMAL: 'normal',
		TANGENT: 'tangent',
		TEXCOORD_0: 'uv',
		TEXCOORD_1: 'uv2',
		COLOR_0: 'color',
		WEIGHTS_0: 'skinWeight',
		JOINTS_0: 'skinIndex'
	};
	const PATH_PROPERTIES = {
		scale: 'scale',
		translation: 'position',
		rotation: 'quaternion',
		weights: 'morphTargetInfluences'
	};
	const INTERPOLATION = {
		CUBICSPLINE: undefined,
		// We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		// keyframe track will be initialized with a default interpolation type, then modified.
		LINEAR: THREE.InterpolateLinear,
		STEP: THREE.InterpolateDiscrete
	};
	const ALPHA_MODES = {
		OPAQUE: 'OPAQUE',
		MASK: 'MASK',
		BLEND: 'BLEND'
	};
	/* UTILITY FUNCTIONS */

	function resolveURL( url, path ) {

		// Invalid URL
		if ( typeof url !== 'string' || url === '' ) return ''; // Host Relative URL

		if ( /^https?:\/\//i.test( path ) && /^\//.test( url ) ) {

			path = path.replace( /(^https?:\/\/[^\/]+).*/i, '$1' );

		} // Absolute URL http://,https://,//


		if ( /^(https?:)?\/\//i.test( url ) ) return url; // Data URI

		if ( /^data:.*,.*$/i.test( url ) ) return url; // Blob URL

		if ( /^blob:.*$/i.test( url ) ) return url; // Relative URL

		return path + url;

	}
	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
	 */


	function createDefaultMaterial( cache ) {

		if ( cache[ 'DefaultMaterial' ] === undefined ) {

			cache[ 'DefaultMaterial' ] = new THREE.MeshStandardMaterial( {
				color: 0xFFFFFF,
				emissive: 0x000000,
				metalness: 1,
				roughness: 1,
				transparent: false,
				depthTest: true,
				side: THREE.FrontSide
			} );

		}

		return cache[ 'DefaultMaterial' ];

	}

	function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

		// Add unknown glTF extensions to an object's userData.
		for ( const name in objectDef.extensions ) {

			if ( knownExtensions[ name ] === undefined ) {

				object.userData.gltfExtensions = object.userData.gltfExtensions || {};
				object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

			}

		}

	}
	/**
	 * @param {Object3D|Material|BufferGeometry} object
	 * @param {GLTF.definition} gltfDef
	 */


	function assignExtrasToUserData( object, gltfDef ) {

		if ( gltfDef.extras !== undefined ) {

			if ( typeof gltfDef.extras === 'object' ) {

				Object.assign( object.userData, gltfDef.extras );

			} else {

				console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

			}

		}

	}
	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
	 *
	 * @param {BufferGeometry} geometry
	 * @param {Array<GLTF.Target>} targets
	 * @param {GLTFParser} parser
	 * @return {Promise<BufferGeometry>}
	 */


	function addMorphTargets( geometry, targets, parser ) {

		let hasMorphPosition = false;
		let hasMorphNormal = false;

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];
			if ( target.POSITION !== undefined ) hasMorphPosition = true;
			if ( target.NORMAL !== undefined ) hasMorphNormal = true;
			if ( hasMorphPosition && hasMorphNormal ) break;

		}

		if ( ! hasMorphPosition && ! hasMorphNormal ) return Promise.resolve( geometry );
		const pendingPositionAccessors = [];
		const pendingNormalAccessors = [];

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];

			if ( hasMorphPosition ) {

				const pendingAccessor = target.POSITION !== undefined ? parser.getDependency( 'accessor', target.POSITION ) : geometry.attributes.position;
				pendingPositionAccessors.push( pendingAccessor );

			}

			if ( hasMorphNormal ) {

				const pendingAccessor = target.NORMAL !== undefined ? parser.getDependency( 'accessor', target.NORMAL ) : geometry.attributes.normal;
				pendingNormalAccessors.push( pendingAccessor );

			}

		}

		return Promise.all( [ Promise.all( pendingPositionAccessors ), Promise.all( pendingNormalAccessors ) ] ).then( function ( accessors ) {

			const morphPositions = accessors[ 0 ];
			const morphNormals = accessors[ 1 ];
			if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
			if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
			geometry.morphTargetsRelative = true;
			return geometry;

		} );

	}
	/**
	 * @param {Mesh} mesh
	 * @param {GLTF.Mesh} meshDef
	 */


	function updateMorphTargets( mesh, meshDef ) {

		mesh.updateMorphTargets();

		if ( meshDef.weights !== undefined ) {

			for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {

				mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

			}

		} // .extras has user-defined data, so check that .extras.targetNames is an array.


		if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

			const targetNames = meshDef.extras.targetNames;

			if ( mesh.morphTargetInfluences.length === targetNames.length ) {

				mesh.morphTargetDictionary = {};

				for ( let i = 0, il = targetNames.length; i < il; i ++ ) {

					mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

				}

			} else {

				console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

			}

		}

	}

	function createPrimitiveKey( primitiveDef ) {

		const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];
		let geometryKey;

		if ( dracoExtension ) {

			geometryKey = 'draco:' + dracoExtension.bufferView + ':' + dracoExtension.indices + ':' + createAttributesKey( dracoExtension.attributes );

		} else {

			geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;

		}

		return geometryKey;

	}

	function createAttributesKey( attributes ) {

		let attributesKey = '';
		const keys = Object.keys( attributes ).sort();

		for ( let i = 0, il = keys.length; i < il; i ++ ) {

			attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';

		}

		return attributesKey;

	}

	function getNormalizedComponentScale( constructor ) {

		// Reference:
		// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data
		switch ( constructor ) {

			case Int8Array:
				return 1 / 127;

			case Uint8Array:
				return 1 / 255;

			case Int16Array:
				return 1 / 32767;

			case Uint16Array:
				return 1 / 65535;

			default:
				throw new Error( 'THREE.GLTFLoader: Unsupported normalized accessor component type.' );

		}

	}
	/* GLTF PARSER */


	class GLTFParser {

		constructor( json = {}, options = {} ) {

			this.json = json;
			this.extensions = {};
			this.plugins = {};
			this.options = options; // loader object cache

			this.cache = new GLTFRegistry(); // associations between Three.js objects and glTF elements

			this.associations = new Map(); // THREE.BufferGeometry caching

			this.primitiveCache = {}; // THREE.Object3D instance caches

			this.meshCache = {
				refs: {},
				uses: {}
			};
			this.cameraCache = {
				refs: {},
				uses: {}
			};
			this.lightCache = {
				refs: {},
				uses: {}
			}; // Track node names, to ensure no duplicates

			this.nodeNamesUsed = {}; // Use an THREE.ImageBitmapLoader if imageBitmaps are supported. Moves much of the
			// expensive work of uploading a texture to the GPU off the main thread.

			if ( typeof createImageBitmap !== 'undefined' && /Firefox/.test( navigator.userAgent ) === false ) {

				this.textureLoader = new THREE.ImageBitmapLoader( this.options.manager );

			} else {

				this.textureLoader = new THREE.TextureLoader( this.options.manager );

			}

			this.textureLoader.setCrossOrigin( this.options.crossOrigin );
			this.textureLoader.setRequestHeader( this.options.requestHeader );
			this.fileLoader = new THREE.FileLoader( this.options.manager );
			this.fileLoader.setResponseType( 'arraybuffer' );

			if ( this.options.crossOrigin === 'use-credentials' ) {

				this.fileLoader.setWithCredentials( true );

			}

		}

		setExtensions( extensions ) {

			this.extensions = extensions;

		}

		setPlugins( plugins ) {

			this.plugins = plugins;

		}

		parse( onLoad, onError ) {

			const parser = this;
			const json = this.json;
			const extensions = this.extensions; // Clear the loader cache

			this.cache.removeAll(); // Mark the special nodes/meshes in json for efficient parse

			this._invokeAll( function ( ext ) {

				return ext._markDefs && ext._markDefs();

			} );

			Promise.all( this._invokeAll( function ( ext ) {

				return ext.beforeRoot && ext.beforeRoot();

			} ) ).then( function () {

				return Promise.all( [ parser.getDependencies( 'scene' ), parser.getDependencies( 'animation' ), parser.getDependencies( 'camera' ) ] );

			} ).then( function ( dependencies ) {

				const result = {
					scene: dependencies[ 0 ][ json.scene || 0 ],
					scenes: dependencies[ 0 ],
					animations: dependencies[ 1 ],
					cameras: dependencies[ 2 ],
					asset: json.asset,
					parser: parser,
					userData: {}
				};
				addUnknownExtensionsToUserData( extensions, result, json );
				assignExtrasToUserData( result, json );
				Promise.all( parser._invokeAll( function ( ext ) {

					return ext.afterRoot && ext.afterRoot( result );

				} ) ).then( function () {

					onLoad( result );

				} );

			} ).catch( onError );

		}
		/**
   * Marks the special nodes/meshes in json for efficient parse.
   */


		_markDefs() {

			const nodeDefs = this.json.nodes || [];
			const skinDefs = this.json.skins || [];
			const meshDefs = this.json.meshes || []; // Nothing in the node definition indicates whether it is a THREE.Bone or an
			// THREE.Object3D. Use the skins' joint references to mark bones.

			for ( let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

				const joints = skinDefs[ skinIndex ].joints;

				for ( let i = 0, il = joints.length; i < il; i ++ ) {

					nodeDefs[ joints[ i ] ].isBone = true;

				}

			} // Iterate over all nodes, marking references to shared resources,
			// as well as skeleton joints.


			for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

				const nodeDef = nodeDefs[ nodeIndex ];

				if ( nodeDef.mesh !== undefined ) {

					this._addNodeRef( this.meshCache, nodeDef.mesh ); // Nothing in the mesh definition indicates whether it is
					// a THREE.SkinnedMesh or THREE.Mesh. Use the node's mesh reference
					// to mark THREE.SkinnedMesh if node has skin.


					if ( nodeDef.skin !== undefined ) {

						meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

					}

				}

				if ( nodeDef.camera !== undefined ) {

					this._addNodeRef( this.cameraCache, nodeDef.camera );

				}

			}

		}
		/**
   * Counts references to shared node / THREE.Object3D resources. These resources
   * can be reused, or "instantiated", at multiple nodes in the scene
   * hierarchy. THREE.Mesh, Camera, and Light instances are instantiated and must
   * be marked. Non-scenegraph resources (like Materials, Geometries, and
   * Textures) can be reused directly and are not marked here.
   *
   * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
   */


		_addNodeRef( cache, index ) {

			if ( index === undefined ) return;

			if ( cache.refs[ index ] === undefined ) {

				cache.refs[ index ] = cache.uses[ index ] = 0;

			}

			cache.refs[ index ] ++;

		}
		/** Returns a reference to a shared resource, cloning it if necessary. */


		_getNodeRef( cache, index, object ) {

			if ( cache.refs[ index ] <= 1 ) return object;
			const ref = object.clone();
			ref.name += '_instance_' + cache.uses[ index ] ++;
			return ref;

		}

		_invokeOne( func ) {

			const extensions = Object.values( this.plugins );
			extensions.push( this );

			for ( let i = 0; i < extensions.length; i ++ ) {

				const result = func( extensions[ i ] );
				if ( result ) return result;

			}

			return null;

		}

		_invokeAll( func ) {

			const extensions = Object.values( this.plugins );
			extensions.unshift( this );
			const pending = [];

			for ( let i = 0; i < extensions.length; i ++ ) {

				const result = func( extensions[ i ] );
				if ( result ) pending.push( result );

			}

			return pending;

		}
		/**
   * Requests the specified dependency asynchronously, with caching.
   * @param {string} type
   * @param {number} index
   * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
   */


		getDependency( type, index ) {

			const cacheKey = type + ':' + index;
			let dependency = this.cache.get( cacheKey );

			if ( ! dependency ) {

				switch ( type ) {

					case 'scene':
						dependency = this.loadScene( index );
						break;

					case 'node':
						dependency = this.loadNode( index );
						break;

					case 'mesh':
						dependency = this._invokeOne( function ( ext ) {

							return ext.loadMesh && ext.loadMesh( index );

						} );
						break;

					case 'accessor':
						dependency = this.loadAccessor( index );
						break;

					case 'bufferView':
						dependency = this._invokeOne( function ( ext ) {

							return ext.loadBufferView && ext.loadBufferView( index );

						} );
						break;

					case 'buffer':
						dependency = this.loadBuffer( index );
						break;

					case 'material':
						dependency = this._invokeOne( function ( ext ) {

							return ext.loadMaterial && ext.loadMaterial( index );

						} );
						break;

					case 'texture':
						dependency = this._invokeOne( function ( ext ) {

							return ext.loadTexture && ext.loadTexture( index );

						} );
						break;

					case 'skin':
						dependency = this.loadSkin( index );
						break;

					case 'animation':
						dependency = this.loadAnimation( index );
						break;

					case 'camera':
						dependency = this.loadCamera( index );
						break;

					default:
						throw new Error( 'Unknown type: ' + type );

				}

				this.cache.add( cacheKey, dependency );

			}

			return dependency;

		}
		/**
   * Requests all dependencies of the specified type asynchronously, with caching.
   * @param {string} type
   * @return {Promise<Array<Object>>}
   */


		getDependencies( type ) {

			let dependencies = this.cache.get( type );

			if ( ! dependencies ) {

				const parser = this;
				const defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];
				dependencies = Promise.all( defs.map( function ( def, index ) {

					return parser.getDependency( type, index );

				} ) );
				this.cache.add( type, dependencies );

			}

			return dependencies;

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */


		loadBuffer( bufferIndex ) {

			const bufferDef = this.json.buffers[ bufferIndex ];
			const loader = this.fileLoader;

			if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

				throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

			} // If present, GLB container is required to be the first buffer.


			if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

				return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

			}

			const options = this.options;
			return new Promise( function ( resolve, reject ) {

				loader.load( resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

					reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

				} );

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */


		loadBufferView( bufferViewIndex ) {

			const bufferViewDef = this.json.bufferViews[ bufferViewIndex ];
			return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

				const byteLength = bufferViewDef.byteLength || 0;
				const byteOffset = bufferViewDef.byteOffset || 0;
				return buffer.slice( byteOffset, byteOffset + byteLength );

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */


		loadAccessor( accessorIndex ) {

			const parser = this;
			const json = this.json;
			const accessorDef = this.json.accessors[ accessorIndex ];

			if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

				// Ignore empty accessors, which may be used to declare runtime
				// information about attributes coming from another source (e.g. Draco
				// compression extension).
				return Promise.resolve( null );

			}

			const pendingBufferViews = [];

			if ( accessorDef.bufferView !== undefined ) {

				pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

			} else {

				pendingBufferViews.push( null );

			}

			if ( accessorDef.sparse !== undefined ) {

				pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
				pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

			}

			return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

				const bufferView = bufferViews[ 0 ];
				const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
				const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ]; // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.

				const elementBytes = TypedArray.BYTES_PER_ELEMENT;
				const itemBytes = elementBytes * itemSize;
				const byteOffset = accessorDef.byteOffset || 0;
				const byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
				const normalized = accessorDef.normalized === true;
				let array, bufferAttribute; // The buffer is not interleaved if the stride is the item size in bytes.

				if ( byteStride && byteStride !== itemBytes ) {

					// Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own THREE.InterleavedBuffer
					// This makes sure that IBA.count reflects accessor.count properly
					const ibSlice = Math.floor( byteOffset / byteStride );
					const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
					let ib = parser.cache.get( ibCacheKey );

					if ( ! ib ) {

						array = new TypedArray( bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes ); // Integer parameters to IB/IBA are in array elements, not bytes.

						ib = new THREE.InterleavedBuffer( array, byteStride / elementBytes );
						parser.cache.add( ibCacheKey, ib );

					}

					bufferAttribute = new THREE.InterleavedBufferAttribute( ib, itemSize, byteOffset % byteStride / elementBytes, normalized );

				} else {

					if ( bufferView === null ) {

						array = new TypedArray( accessorDef.count * itemSize );

					} else {

						array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

					}

					bufferAttribute = new THREE.BufferAttribute( array, itemSize, normalized );

				} // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors


				if ( accessorDef.sparse !== undefined ) {

					const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
					const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];
					const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
					const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;
					const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
					const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

					if ( bufferView !== null ) {

						// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
						bufferAttribute = new THREE.BufferAttribute( bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

					}

					for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

						const index = sparseIndices[ i ];
						bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
						if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
						if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
						if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
						if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse THREE.BufferAttribute.' );

					}

				}

				return bufferAttribute;

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   * @param {number} textureIndex
   * @return {Promise<THREE.Texture>}
   */


		loadTexture( textureIndex ) {

			const json = this.json;
			const options = this.options;
			const textureDef = json.textures[ textureIndex ];
			const source = json.images[ textureDef.source ];
			let loader = this.textureLoader;

			if ( source.uri ) {

				const handler = options.manager.getHandler( source.uri );
				if ( handler !== null ) loader = handler;

			}

			return this.loadTextureImage( textureIndex, source, loader );

		}

		loadTextureImage( textureIndex, source, loader ) {

			const parser = this;
			const json = this.json;
			const options = this.options;
			const textureDef = json.textures[ textureIndex ];
			const URL = self.URL || self.webkitURL;
			let sourceURI = source.uri;
			let isObjectURL = false;
			let hasAlpha = true;
			if ( source.mimeType === 'image/jpeg' ) hasAlpha = false;

			if ( source.bufferView !== undefined ) {

				// Load binary image data from bufferView, if provided.
				sourceURI = parser.getDependency( 'bufferView', source.bufferView ).then( function ( bufferView ) {

					if ( source.mimeType === 'image/png' ) {

						// Inspect the PNG 'IHDR' chunk to determine whether the image could have an
						// alpha channel. This check is conservative — the image could have an alpha
						// channel with all values == 1, and the indexed type (colorType == 3) only
						// sometimes contains alpha.
						//
						// https://en.wikipedia.org/wiki/Portable_Network_Graphics#File_header
						const colorType = new DataView( bufferView, 25, 1 ).getUint8( 0, false );
						hasAlpha = colorType === 6 || colorType === 4 || colorType === 3;

					}

					isObjectURL = true;
					const blob = new Blob( [ bufferView ], {
						type: source.mimeType
					} );
					sourceURI = URL.createObjectURL( blob );
					return sourceURI;

				} );

			} else if ( source.uri === undefined ) {

				throw new Error( 'THREE.GLTFLoader: Image ' + textureIndex + ' is missing URI and bufferView' );

			}

			return Promise.resolve( sourceURI ).then( function ( sourceURI ) {

				return new Promise( function ( resolve, reject ) {

					let onLoad = resolve;

					if ( loader.isImageBitmapLoader === true ) {

						onLoad = function ( imageBitmap ) {

							resolve( new THREE.CanvasTexture( imageBitmap ) );

						};

					}

					loader.load( resolveURL( sourceURI, options.path ), onLoad, undefined, reject );

				} );

			} ).then( function ( texture ) {

				// Clean up resources and configure Texture.
				if ( isObjectURL === true ) {

					URL.revokeObjectURL( sourceURI );

				}

				texture.flipY = false;
				if ( textureDef.name ) texture.name = textureDef.name; // When there is definitely no alpha channel in the texture, set THREE.RGBFormat to save space.

				if ( ! hasAlpha ) texture.format = THREE.RGBFormat;
				const samplers = json.samplers || {};
				const sampler = samplers[ textureDef.sampler ] || {};
				texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || THREE.LinearFilter;
				texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || THREE.LinearMipmapLinearFilter;
				texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || THREE.RepeatWrapping;
				texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || THREE.RepeatWrapping;
				parser.associations.set( texture, {
					type: 'textures',
					index: textureIndex
				} );
				return texture;

			} );

		}
		/**
   * Asynchronously assigns a texture to the given material parameters.
   * @param {Object} materialParams
   * @param {string} mapName
   * @param {Object} mapDef
   * @return {Promise}
   */


		assignTexture( materialParams, mapName, mapDef ) {

			const parser = this;
			return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

				// Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
				// However, we will copy UV set 0 to UV set 1 on demand for aoMap
				if ( mapDef.texCoord !== undefined && mapDef.texCoord != 0 && ! ( mapName === 'aoMap' && mapDef.texCoord == 1 ) ) {

					console.warn( 'THREE.GLTFLoader: Custom UV set ' + mapDef.texCoord + ' for texture ' + mapName + ' not yet supported.' );

				}

				if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

					const transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

					if ( transform ) {

						const gltfReference = parser.associations.get( texture );
						texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );
						parser.associations.set( texture, gltfReference );

					}

				}

				materialParams[ mapName ] = texture;

			} );

		}
		/**
   * Assigns final material to a THREE.Mesh, THREE.Line, or THREE.Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accommodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   * @param  {Object3D} mesh THREE.Mesh, THREE.Line, or THREE.Points instance.
   */


		assignFinalMaterial( mesh ) {

			const geometry = mesh.geometry;
			let material = mesh.material;
			const useVertexTangents = geometry.attributes.tangent !== undefined;
			const useVertexColors = geometry.attributes.color !== undefined;
			const useFlatShading = geometry.attributes.normal === undefined;
			const useSkinning = mesh.isSkinnedMesh === true;
			const useMorphTargets = Object.keys( geometry.morphAttributes ).length > 0;
			const useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;

			if ( mesh.isPoints ) {

				const cacheKey = 'PointsMaterial:' + material.uuid;
				let pointsMaterial = this.cache.get( cacheKey );

				if ( ! pointsMaterial ) {

					pointsMaterial = new THREE.PointsMaterial();
					THREE.Material.prototype.copy.call( pointsMaterial, material );
					pointsMaterial.color.copy( material.color );
					pointsMaterial.map = material.map;
					pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

					this.cache.add( cacheKey, pointsMaterial );

				}

				material = pointsMaterial;

			} else if ( mesh.isLine ) {

				const cacheKey = 'LineBasicMaterial:' + material.uuid;
				let lineMaterial = this.cache.get( cacheKey );

				if ( ! lineMaterial ) {

					lineMaterial = new THREE.LineBasicMaterial();
					THREE.Material.prototype.copy.call( lineMaterial, material );
					lineMaterial.color.copy( material.color );
					this.cache.add( cacheKey, lineMaterial );

				}

				material = lineMaterial;

			} // Clone the material if it will be modified


			if ( useVertexTangents || useVertexColors || useFlatShading || useSkinning || useMorphTargets ) {

				let cacheKey = 'ClonedMaterial:' + material.uuid + ':';
				if ( material.isGLTFSpecularGlossinessMaterial ) cacheKey += 'specular-glossiness:';
				if ( useSkinning ) cacheKey += 'skinning:';
				if ( useVertexTangents ) cacheKey += 'vertex-tangents:';
				if ( useVertexColors ) cacheKey += 'vertex-colors:';
				if ( useFlatShading ) cacheKey += 'flat-shading:';
				if ( useMorphTargets ) cacheKey += 'morph-targets:';
				if ( useMorphNormals ) cacheKey += 'morph-normals:';
				let cachedMaterial = this.cache.get( cacheKey );

				if ( ! cachedMaterial ) {

					cachedMaterial = material.clone();
					if ( useSkinning ) cachedMaterial.skinning = true;
					if ( useVertexColors ) cachedMaterial.vertexColors = true;
					if ( useFlatShading ) cachedMaterial.flatShading = true;
					if ( useMorphTargets ) cachedMaterial.morphTargets = true;
					if ( useMorphNormals ) cachedMaterial.morphNormals = true;

					if ( useVertexTangents ) {

						cachedMaterial.vertexTangents = true; // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995

						if ( cachedMaterial.normalScale ) cachedMaterial.normalScale.y *= - 1;
						if ( cachedMaterial.clearcoatNormalScale ) cachedMaterial.clearcoatNormalScale.y *= - 1;

					}

					this.cache.add( cacheKey, cachedMaterial );
					this.associations.set( cachedMaterial, this.associations.get( material ) );

				}

				material = cachedMaterial;

			} // workarounds for mesh and geometry


			if ( material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {

				geometry.setAttribute( 'uv2', geometry.attributes.uv );

			}

			mesh.material = material;

		}

		getMaterialType( ) {

			return THREE.MeshStandardMaterial;

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */


		loadMaterial( materialIndex ) {

			const parser = this;
			const json = this.json;
			const extensions = this.extensions;
			const materialDef = json.materials[ materialIndex ];
			let materialType;
			const materialParams = {};
			const materialExtensions = materialDef.extensions || {};
			const pending = [];

			if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ] ) {

				const sgExtension = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ];
				materialType = sgExtension.getMaterialType();
				pending.push( sgExtension.extendParams( materialParams, materialDef, parser ) );

			} else if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

				const kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
				materialType = kmuExtension.getMaterialType();
				pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

			} else {

				// Specification:
				// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
				const metallicRoughness = materialDef.pbrMetallicRoughness || {};
				materialParams.color = new THREE.Color( 1.0, 1.0, 1.0 );
				materialParams.opacity = 1.0;

				if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

					const array = metallicRoughness.baseColorFactor;
					materialParams.color.fromArray( array );
					materialParams.opacity = array[ 3 ];

				}

				if ( metallicRoughness.baseColorTexture !== undefined ) {

					pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture ) );

				}

				materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
				materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

				if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

					pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
					pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

				}

				materialType = this._invokeOne( function ( ext ) {

					return ext.getMaterialType && ext.getMaterialType( materialIndex );

				} );
				pending.push( Promise.all( this._invokeAll( function ( ext ) {

					return ext.extendMaterialParams && ext.extendMaterialParams( materialIndex, materialParams );

				} ) ) );

			}

			if ( materialDef.doubleSided === true ) {

				materialParams.side = THREE.DoubleSide;

			}

			const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

			if ( alphaMode === ALPHA_MODES.BLEND ) {

				materialParams.transparent = true; // See: https://github.com/mrdoob/three.js/issues/17706

				materialParams.depthWrite = false;

			} else {

				materialParams.transparent = false;

				if ( alphaMode === ALPHA_MODES.MASK ) {

					materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

				}

			}

			if ( materialDef.normalTexture !== undefined && materialType !== THREE.MeshBasicMaterial ) {

				pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) ); // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995

				materialParams.normalScale = new THREE.Vector2( 1, - 1 );

				if ( materialDef.normalTexture.scale !== undefined ) {

					materialParams.normalScale.set( materialDef.normalTexture.scale, - materialDef.normalTexture.scale );

				}

			}

			if ( materialDef.occlusionTexture !== undefined && materialType !== THREE.MeshBasicMaterial ) {

				pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

				if ( materialDef.occlusionTexture.strength !== undefined ) {

					materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

				}

			}

			if ( materialDef.emissiveFactor !== undefined && materialType !== THREE.MeshBasicMaterial ) {

				materialParams.emissive = new THREE.Color().fromArray( materialDef.emissiveFactor );

			}

			if ( materialDef.emissiveTexture !== undefined && materialType !== THREE.MeshBasicMaterial ) {

				pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture ) );

			}

			return Promise.all( pending ).then( function () {

				let material;

				if ( materialType === GLTFMeshStandardSGMaterial ) {

					material = extensions[ EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS ].createMaterial( materialParams );

				} else {

					material = new materialType( materialParams );

				}

				if ( materialDef.name ) material.name = materialDef.name; // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.

				if ( material.map ) material.map.encoding = THREE.sRGBEncoding;
				if ( material.emissiveMap ) material.emissiveMap.encoding = THREE.sRGBEncoding;
				assignExtrasToUserData( material, materialDef );
				parser.associations.set( material, {
					type: 'materials',
					index: materialIndex
				} );
				if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );
				return material;

			} );

		}
		/** When THREE.Object3D instances are targeted by animation, they need unique names. */


		createUniqueName( originalName ) {

			const sanitizedName = THREE.PropertyBinding.sanitizeNodeName( originalName || '' );
			let name = sanitizedName;

			for ( let i = 1; this.nodeNamesUsed[ name ]; ++ i ) {

				name = sanitizedName + '_' + i;

			}

			this.nodeNamesUsed[ name ] = true;
			return name;

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */


		loadGeometries( primitives ) {

			const parser = this;
			const extensions = this.extensions;
			const cache = this.primitiveCache;

			function createDracoPrimitive( primitive ) {

				return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ].decodePrimitive( primitive, parser ).then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

			}

			const pending = [];

			for ( let i = 0, il = primitives.length; i < il; i ++ ) {

				const primitive = primitives[ i ];
				const cacheKey = createPrimitiveKey( primitive ); // See if we've already created this geometry

				const cached = cache[ cacheKey ];

				if ( cached ) {

					// Use the cached geometry if it exists
					pending.push( cached.promise );

				} else {

					let geometryPromise;

					if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

						// Use DRACO geometry if available
						geometryPromise = createDracoPrimitive( primitive );

					} else {

						// Otherwise create a new geometry
						geometryPromise = addPrimitiveAttributes( new THREE.BufferGeometry(), primitive, parser );

					} // Cache this geometry


					cache[ cacheKey ] = {
						primitive: primitive,
						promise: geometryPromise
					};
					pending.push( geometryPromise );

				}

			}

			return Promise.all( pending );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   * @param {number} meshIndex
   * @return {Promise<Group|Mesh|SkinnedMesh>}
   */


		loadMesh( meshIndex ) {

			const parser = this;
			const json = this.json;
			const extensions = this.extensions;
			const meshDef = json.meshes[ meshIndex ];
			const primitives = meshDef.primitives;
			const pending = [];

			for ( let i = 0, il = primitives.length; i < il; i ++ ) {

				const material = primitives[ i ].material === undefined ? createDefaultMaterial( this.cache ) : this.getDependency( 'material', primitives[ i ].material );
				pending.push( material );

			}

			pending.push( parser.loadGeometries( primitives ) );
			return Promise.all( pending ).then( function ( results ) {

				const materials = results.slice( 0, results.length - 1 );
				const geometries = results[ results.length - 1 ];
				const meshes = [];

				for ( let i = 0, il = geometries.length; i < il; i ++ ) {

					const geometry = geometries[ i ];
					const primitive = primitives[ i ]; // 1. create THREE.Mesh

					let mesh;
					const material = materials[ i ];

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN || primitive.mode === undefined ) {

						// .isSkinnedMesh isn't in glTF spec. See ._markDefs()
						mesh = meshDef.isSkinnedMesh === true ? new THREE.SkinnedMesh( geometry, material ) : new THREE.Mesh( geometry, material );

						if ( mesh.isSkinnedMesh === true && ! mesh.geometry.attributes.skinWeight.normalized ) {

							// we normalize floating point skin weight array to fix malformed assets (see #15319)
							// it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
							mesh.normalizeSkinWeights();

						}

						if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

							mesh.geometry = toTrianglesDrawMode( mesh.geometry, THREE.TriangleStripDrawMode );

						} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

							mesh.geometry = toTrianglesDrawMode( mesh.geometry, THREE.TriangleFanDrawMode );

						}

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

						mesh = new THREE.LineSegments( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

						mesh = new THREE.Line( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

						mesh = new THREE.LineLoop( geometry, material );

					} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

						mesh = new THREE.Points( geometry, material );

					} else {

						throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

					}

					if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

						updateMorphTargets( mesh, meshDef );

					}

					mesh.name = parser.createUniqueName( meshDef.name || 'mesh_' + meshIndex );
					assignExtrasToUserData( mesh, meshDef );
					if ( primitive.extensions ) addUnknownExtensionsToUserData( extensions, mesh, primitive );
					parser.assignFinalMaterial( mesh );
					meshes.push( mesh );

				}

				if ( meshes.length === 1 ) {

					return meshes[ 0 ];

				}

				const group = new THREE.Group();

				for ( let i = 0, il = meshes.length; i < il; i ++ ) {

					group.add( meshes[ i ] );

				}

				return group;

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   * @param {number} cameraIndex
   * @return {Promise<THREE.Camera>}
   */


		loadCamera( cameraIndex ) {

			let camera;
			const cameraDef = this.json.cameras[ cameraIndex ];
			const params = cameraDef[ cameraDef.type ];

			if ( ! params ) {

				console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
				return;

			}

			if ( cameraDef.type === 'perspective' ) {

				camera = new THREE.PerspectiveCamera( THREE.MathUtils.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

			} else if ( cameraDef.type === 'orthographic' ) {

				camera = new THREE.OrthographicCamera( - params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar );

			}

			if ( cameraDef.name ) camera.name = this.createUniqueName( cameraDef.name );
			assignExtrasToUserData( camera, cameraDef );
			return Promise.resolve( camera );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Object>}
   */


		loadSkin( skinIndex ) {

			const skinDef = this.json.skins[ skinIndex ];
			const skinEntry = {
				joints: skinDef.joints
			};

			if ( skinDef.inverseBindMatrices === undefined ) {

				return Promise.resolve( skinEntry );

			}

			return this.getDependency( 'accessor', skinDef.inverseBindMatrices ).then( function ( accessor ) {

				skinEntry.inverseBindMatrices = accessor;
				return skinEntry;

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */


		loadAnimation( animationIndex ) {

			const json = this.json;
			const animationDef = json.animations[ animationIndex ];
			const pendingNodes = [];
			const pendingInputAccessors = [];
			const pendingOutputAccessors = [];
			const pendingSamplers = [];
			const pendingTargets = [];

			for ( let i = 0, il = animationDef.channels.length; i < il; i ++ ) {

				const channel = animationDef.channels[ i ];
				const sampler = animationDef.samplers[ channel.sampler ];
				const target = channel.target;
				const name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.

				const input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
				const output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;
				pendingNodes.push( this.getDependency( 'node', name ) );
				pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
				pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
				pendingSamplers.push( sampler );
				pendingTargets.push( target );

			}

			return Promise.all( [ Promise.all( pendingNodes ), Promise.all( pendingInputAccessors ), Promise.all( pendingOutputAccessors ), Promise.all( pendingSamplers ), Promise.all( pendingTargets ) ] ).then( function ( dependencies ) {

				const nodes = dependencies[ 0 ];
				const inputAccessors = dependencies[ 1 ];
				const outputAccessors = dependencies[ 2 ];
				const samplers = dependencies[ 3 ];
				const targets = dependencies[ 4 ];
				const tracks = [];

				for ( let i = 0, il = nodes.length; i < il; i ++ ) {

					const node = nodes[ i ];
					const inputAccessor = inputAccessors[ i ];
					const outputAccessor = outputAccessors[ i ];
					const sampler = samplers[ i ];
					const target = targets[ i ];
					if ( node === undefined ) continue;
					node.updateMatrix();
					node.matrixAutoUpdate = true;
					let TypedKeyframeTrack;

					switch ( PATH_PROPERTIES[ target.path ] ) {

						case PATH_PROPERTIES.weights:
							TypedKeyframeTrack = THREE.NumberKeyframeTrack;
							break;

						case PATH_PROPERTIES.rotation:
							TypedKeyframeTrack = THREE.QuaternionKeyframeTrack;
							break;

						case PATH_PROPERTIES.position:
						case PATH_PROPERTIES.scale:
						default:
							TypedKeyframeTrack = THREE.VectorKeyframeTrack;
							break;

					}

					const targetName = node.name ? node.name : node.uuid;
					const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : THREE.InterpolateLinear;
					const targetNames = [];

					if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

						// Node may be a THREE.Group (glTF mesh with several primitives) or a THREE.Mesh.
						node.traverse( function ( object ) {

							if ( object.isMesh === true && object.morphTargetInfluences ) {

								targetNames.push( object.name ? object.name : object.uuid );

							}

						} );

					} else {

						targetNames.push( targetName );

					}

					let outputArray = outputAccessor.array;

					if ( outputAccessor.normalized ) {

						const scale = getNormalizedComponentScale( outputArray.constructor );
						const scaled = new Float32Array( outputArray.length );

						for ( let j = 0, jl = outputArray.length; j < jl; j ++ ) {

							scaled[ j ] = outputArray[ j ] * scale;

						}

						outputArray = scaled;

					}

					for ( let j = 0, jl = targetNames.length; j < jl; j ++ ) {

						const track = new TypedKeyframeTrack( targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ], inputAccessor.array, outputArray, interpolation ); // Override interpolation with custom factory method.

						if ( sampler.interpolation === 'CUBICSPLINE' ) {

							track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

								// A CUBICSPLINE keyframe in glTF has three output values for each input value,
								// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
								// must be divided by three to get the interpolant's sampleSize argument.
								return new GLTFCubicSplineInterpolant( this.times, this.values, this.getValueSize() / 3, result );

							}; // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.


							track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

						}

						tracks.push( track );

					}

				}

				const name = animationDef.name ? animationDef.name : 'animation_' + animationIndex;
				return new THREE.AnimationClip( name, undefined, tracks );

			} );

		}

		createNodeMesh( nodeIndex ) {

			const json = this.json;
			const parser = this;
			const nodeDef = json.nodes[ nodeIndex ];
			if ( nodeDef.mesh === undefined ) return null;
			return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

				const node = parser._getNodeRef( parser.meshCache, nodeDef.mesh, mesh ); // if weights are provided on the node, override weights on the mesh.


				if ( nodeDef.weights !== undefined ) {

					node.traverse( function ( o ) {

						if ( ! o.isMesh ) return;

						for ( let i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

							o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

						}

					} );

				}

				return node;

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */


		loadNode( nodeIndex ) {

			const json = this.json;
			const extensions = this.extensions;
			const parser = this;
			const nodeDef = json.nodes[ nodeIndex ]; // reserve node's name before its dependencies, so the root has the intended name.

			const nodeName = nodeDef.name ? parser.createUniqueName( nodeDef.name ) : '';
			return function () {

				const pending = [];

				const meshPromise = parser._invokeOne( function ( ext ) {

					return ext.createNodeMesh && ext.createNodeMesh( nodeIndex );

				} );

				if ( meshPromise ) {

					pending.push( meshPromise );

				}

				if ( nodeDef.camera !== undefined ) {

					pending.push( parser.getDependency( 'camera', nodeDef.camera ).then( function ( camera ) {

						return parser._getNodeRef( parser.cameraCache, nodeDef.camera, camera );

					} ) );

				}

				parser._invokeAll( function ( ext ) {

					return ext.createNodeAttachment && ext.createNodeAttachment( nodeIndex );

				} ).forEach( function ( promise ) {

					pending.push( promise );

				} );

				return Promise.all( pending );

			}().then( function ( objects ) {

				let node; // .isBone isn't in glTF spec. See ._markDefs

				if ( nodeDef.isBone === true ) {

					node = new THREE.Bone();

				} else if ( objects.length > 1 ) {

					node = new THREE.Group();

				} else if ( objects.length === 1 ) {

					node = objects[ 0 ];

				} else {

					node = new THREE.Object3D();

				}

				if ( node !== objects[ 0 ] ) {

					for ( let i = 0, il = objects.length; i < il; i ++ ) {

						node.add( objects[ i ] );

					}

				}

				if ( nodeDef.name ) {

					node.userData.name = nodeDef.name;
					node.name = nodeName;

				}

				assignExtrasToUserData( node, nodeDef );
				if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

				if ( nodeDef.matrix !== undefined ) {

					const matrix = new THREE.Matrix4();
					matrix.fromArray( nodeDef.matrix );
					node.applyMatrix4( matrix );

				} else {

					if ( nodeDef.translation !== undefined ) {

						node.position.fromArray( nodeDef.translation );

					}

					if ( nodeDef.rotation !== undefined ) {

						node.quaternion.fromArray( nodeDef.rotation );

					}

					if ( nodeDef.scale !== undefined ) {

						node.scale.fromArray( nodeDef.scale );

					}

				}

				parser.associations.set( node, {
					type: 'nodes',
					index: nodeIndex
				} );
				return node;

			} );

		}
		/**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   * @param {number} sceneIndex
   * @return {Promise<Group>}
   */


		loadScene( sceneIndex ) {

			const json = this.json;
			const extensions = this.extensions;
			const sceneDef = this.json.scenes[ sceneIndex ];
			const parser = this; // THREE.Loader returns THREE.Group, not Scene.
			// See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172

			const scene = new THREE.Group();
			if ( sceneDef.name ) scene.name = parser.createUniqueName( sceneDef.name );
			assignExtrasToUserData( scene, sceneDef );
			if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );
			const nodeIds = sceneDef.nodes || [];
			const pending = [];

			for ( let i = 0, il = nodeIds.length; i < il; i ++ ) {

				pending.push( buildNodeHierachy( nodeIds[ i ], scene, json, parser ) );

			}

			return Promise.all( pending ).then( function () {

				return scene;

			} );

		}

	}

	function buildNodeHierachy( nodeId, parentObject, json, parser ) {

		const nodeDef = json.nodes[ nodeId ];
		return parser.getDependency( 'node', nodeId ).then( function ( node ) {

			if ( nodeDef.skin === undefined ) return node; // build skeleton here as well

			let skinEntry;
			return parser.getDependency( 'skin', nodeDef.skin ).then( function ( skin ) {

				skinEntry = skin;
				const pendingJoints = [];

				for ( let i = 0, il = skinEntry.joints.length; i < il; i ++ ) {

					pendingJoints.push( parser.getDependency( 'node', skinEntry.joints[ i ] ) );

				}

				return Promise.all( pendingJoints );

			} ).then( function ( jointNodes ) {

				node.traverse( function ( mesh ) {

					if ( ! mesh.isMesh ) return;
					const bones = [];
					const boneInverses = [];

					for ( let j = 0, jl = jointNodes.length; j < jl; j ++ ) {

						const jointNode = jointNodes[ j ];

						if ( jointNode ) {

							bones.push( jointNode );
							const mat = new THREE.Matrix4();

							if ( skinEntry.inverseBindMatrices !== undefined ) {

								mat.fromArray( skinEntry.inverseBindMatrices.array, j * 16 );

							}

							boneInverses.push( mat );

						} else {

							console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[ j ] );

						}

					}

					mesh.bind( new THREE.Skeleton( bones, boneInverses ), mesh.matrixWorld );

				} );
				return node;

			} );

		} ).then( function ( node ) {

			// build node hierachy
			parentObject.add( node );
			const pending = [];

			if ( nodeDef.children ) {

				const children = nodeDef.children;

				for ( let i = 0, il = children.length; i < il; i ++ ) {

					const child = children[ i ];
					pending.push( buildNodeHierachy( child, node, json, parser ) );

				}

			}

			return Promise.all( pending );

		} );

	}
	/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */


	function computeBounds( geometry, primitiveDef, parser ) {

		const attributes = primitiveDef.attributes;
		const box = new THREE.Box3();

		if ( attributes.POSITION !== undefined ) {

			const accessor = parser.json.accessors[ attributes.POSITION ];
			const min = accessor.min;
			const max = accessor.max; // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

			if ( min !== undefined && max !== undefined ) {

				box.set( new THREE.Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ), new THREE.Vector3( max[ 0 ], max[ 1 ], max[ 2 ] ) );

				if ( accessor.normalized ) {

					const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
					box.min.multiplyScalar( boxScale );
					box.max.multiplyScalar( boxScale );

				}

			} else {

				console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );
				return;

			}

		} else {

			return;

		}

		const targets = primitiveDef.targets;

		if ( targets !== undefined ) {

			const maxDisplacement = new THREE.Vector3();
			const vector = new THREE.Vector3();

			for ( let i = 0, il = targets.length; i < il; i ++ ) {

				const target = targets[ i ];

				if ( target.POSITION !== undefined ) {

					const accessor = parser.json.accessors[ target.POSITION ];
					const min = accessor.min;
					const max = accessor.max; // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

					if ( min !== undefined && max !== undefined ) {

						// we need to get max of absolute components because target weight is [-1,1]
						vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
						vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
						vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );

						if ( accessor.normalized ) {

							const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
							vector.multiplyScalar( boxScale );

						} // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
						// to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
						// are used to implement key-frame animations and as such only two are active at a time - this results in very large
						// boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.


						maxDisplacement.max( vector );

					} else {

						console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

					}

				}

			} // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.


			box.expandByVector( maxDisplacement );

		}

		geometry.boundingBox = box;
		const sphere = new THREE.Sphere();
		box.getCenter( sphere.center );
		sphere.radius = box.min.distanceTo( box.max ) / 2;
		geometry.boundingSphere = sphere;

	}
	/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */


	function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

		const attributes = primitiveDef.attributes;
		const pending = [];

		function assignAttributeAccessor( accessorIndex, attributeName ) {

			return parser.getDependency( 'accessor', accessorIndex ).then( function ( accessor ) {

				geometry.setAttribute( attributeName, accessor );

			} );

		}

		for ( const gltfAttributeName in attributes ) {

			const threeAttributeName = ATTRIBUTES[ gltfAttributeName ] || gltfAttributeName.toLowerCase(); // Skip attributes already provided by e.g. Draco extension.

			if ( threeAttributeName in geometry.attributes ) continue;
			pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

		}

		if ( primitiveDef.indices !== undefined && ! geometry.index ) {

			const accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

				geometry.setIndex( accessor );

			} );
			pending.push( accessor );

		}

		assignExtrasToUserData( geometry, primitiveDef );
		computeBounds( geometry, primitiveDef, parser );
		return Promise.all( pending ).then( function () {

			return primitiveDef.targets !== undefined ? addMorphTargets( geometry, primitiveDef.targets, parser ) : geometry;

		} );

	}
	/**
 * @param {BufferGeometry} geometry
 * @param {Number} drawMode
 * @return {BufferGeometry}
 */


	function toTrianglesDrawMode( geometry, drawMode ) {

		let index = geometry.getIndex(); // generate index if not present

		if ( index === null ) {

			const indices = [];
			const position = geometry.getAttribute( 'position' );

			if ( position !== undefined ) {

				for ( let i = 0; i < position.count; i ++ ) {

					indices.push( i );

				}

				geometry.setIndex( indices );
				index = geometry.getIndex();

			} else {

				console.error( 'THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
				return geometry;

			}

		} //


		const numberOfTriangles = index.count - 2;
		const newIndices = [];

		if ( drawMode === THREE.TriangleFanDrawMode ) {

			// gl.TRIANGLE_FAN
			for ( let i = 1; i <= numberOfTriangles; i ++ ) {

				newIndices.push( index.getX( 0 ) );
				newIndices.push( index.getX( i ) );
				newIndices.push( index.getX( i + 1 ) );

			}

		} else {

			// gl.TRIANGLE_STRIP
			for ( let i = 0; i < numberOfTriangles; i ++ ) {

				if ( i % 2 === 0 ) {

					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i + 2 ) );

				} else {

					newIndices.push( index.getX( i + 2 ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i ) );

				}

			}

		}

		if ( newIndices.length / 3 !== numberOfTriangles ) {

			console.error( 'THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

		} // build final geometry


		const newGeometry = geometry.clone();
		newGeometry.setIndex( newIndices );
		return newGeometry;

	}

	THREE.GLTFLoader = GLTFLoader;

} )();

const GLB_DATA={"solocup": "models/props/solocup.glb?v=1790383946", "church": "models/props/church.glb?v=1790383946", "donkeys": "models/props/donkeys.glb?v=1790383946", "hijoe": "models/props/hijoe.glb?v=1790383946", "palm": "models/props/palm.glb?v=1790383946", "mrblack": "models/props/mrblack.glb?v=1790383946", "ak": "models/props/ak.glb?v=1790383946", "hellcat": "models/cars/hellcat.glb?v=1790383946", "brcc": "models/cars/rotor.glb?v=1790383946", "fdc": "models/cars/rrpickup.glb?v=1790383946", "shoe_factory": "models/props/shoe_factory.glb?v=1790383946", "claw_can": "models/props/claw_can.glb?v=1790383946", "echelon_can": "models/props/echelon_can.glb?v=1790383946", "watch_shop": "models/props/watch_shop.glb?v=1790383946", "watch_sign": "models/props/watch_sign.glb?v=1790383946", "range_sign": "models/props/range_sign.glb?v=1790383946", "bpd": "models/cars/bpd_69.glb?v=1790383946", "concord": "models/cars/concordance.glb?v=1790383946", "donut": "models/cars/donut_patrol.glb?v=1790383946", "duck": "models/cars/duck_plasma.glb?v=1790383946", "gt44": "models/cars/gt40.glb?v=1790383946", "missile": "models/cars/missile_commander.glb?v=1790383946", "leopard": "models/cars/night_leopard.glb?v=1790383946", "trout": "models/cars/trout_protocol.glb?v=1790383946"};
const GLB_TEX={"solocup": {"base": "models/props/solocup_base.jpg?v=1790383946", "mr": "models/props/solocup_mr.jpg?v=1790383946"}, "church": {"base": "models/props/church_base.jpg?v=1790383946", "normal": "models/props/church_normal.jpg?v=1790383946", "mr": "models/props/church_mr.jpg?v=1790383946"}, "donkeys": {"base": "models/props/donkeys_base.jpg?v=1790383946", "mr": "models/props/donkeys_mr.jpg?v=1790383946"}, "hijoe": {"base": "models/props/hijoe_base.jpg?v=1790383946", "mr": "models/props/hijoe_mr.jpg?v=1790383946"}, "palm": {"base": "models/props/palm_base.jpg?v=1790383946", "normal": "models/props/palm_normal.jpg?v=1790383946", "mr": "models/props/palm_mr.jpg?v=1790383946"}, "mrblack": {"base": "models/props/mrblack_base.jpg?v=1790383946", "normal": "models/props/mrblack_normal.jpg?v=1790383946", "mr": "models/props/mrblack_mr.jpg?v=1790383946"}, "ak": {"base": "models/props/ak_base.jpg?v=1790383946", "normal": "models/props/ak_normal.jpg?v=1790383946", "mr": "models/props/ak_mr.jpg?v=1790383946"}, "hellcat": {"base": "models/cars/hellcat_base.jpg?v=1790383946", "normal": "models/cars/hellcat_normal.jpg?v=1790383946", "mr": "models/cars/hellcat_mr.jpg?v=1790383946"}, "brcc": {"base": "models/cars/rotor_base.jpg?v=1790383946", "normal": "models/cars/rotor_normal.jpg?v=1790383946", "mr": "models/cars/rotor_mr.jpg?v=1790383946"}, "fdc": {"base": "models/cars/rrpickup_base.jpg?v=1790383946", "normal": "models/cars/rrpickup_normal.jpg?v=1790383946", "mr": "models/cars/rrpickup_mr.jpg?v=1790383946"}, "shoe_factory": {"base": "models/props/shoe_factory_base.jpg?v=1790383946", "normal": "models/props/shoe_factory_normal.jpg?v=1790383946", "mr": "models/props/shoe_factory_mr.jpg?v=1790383946"}, "claw_can": {"base": "models/props/claw_can_base.jpg?v=1790383946", "normal": "models/props/claw_can_normal.jpg?v=1790383946", "mr": "models/props/claw_can_mr.jpg?v=1790383946"}, "echelon_can": {"base": "models/props/echelon_can_base.jpg?v=1790383946", "normal": "models/props/echelon_can_normal.jpg?v=1790383946", "mr": "models/props/echelon_can_mr.jpg?v=1790383946"}, "watch_shop": {"base": "models/props/watch_shop_base.jpg?v=1790383946", "normal": "models/props/watch_shop_normal.jpg?v=1790383946", "mr": "models/props/watch_shop_mr.jpg?v=1790383946"}, "watch_sign": {"base": "models/props/watch_sign_base.jpg?v=1790383946", "normal": "models/props/watch_sign_normal.jpg?v=1790383946", "mr": "models/props/watch_sign_mr.jpg?v=1790383946"}, "range_sign": {"base": "models/props/range_sign_base.jpg?v=1790383946", "normal": "models/props/range_sign_normal.jpg?v=1790383946", "mr": "models/props/range_sign_mr.jpg?v=1790383946"}, "bpd": {"base": "models/cars/bpd_69_base.jpg?v=1790383946", "normal": "models/cars/bpd_69_normal.jpg?v=1790383946", "mr": "models/cars/bpd_69_mr.jpg?v=1790383946"}, "concord": {"base": "models/cars/concordance_base.jpg?v=1790383946", "normal": "models/cars/concordance_normal.jpg?v=1790383946", "mr": "models/cars/concordance_mr.jpg?v=1790383946"}, "donut": {"base": "models/cars/donut_patrol_base.jpg?v=1790383946", "normal": "models/cars/donut_patrol_normal.jpg?v=1790383946", "mr": "models/cars/donut_patrol_mr.jpg?v=1790383946"}, "duck": {"base": "models/cars/duck_plasma_base.jpg?v=1790383946", "normal": "models/cars/duck_plasma_normal.jpg?v=1790383946", "mr": "models/cars/duck_plasma_mr.jpg?v=1790383946"}, "gt44": {"base": "models/cars/gt40_base.jpg?v=1790383946", "normal": "models/cars/gt40_normal.jpg?v=1790383946", "mr": "models/cars/gt40_mr.jpg?v=1790383946"}, "missile": {"base": "models/cars/missile_commander_base.jpg?v=1790383946", "normal": "models/cars/missile_commander_normal.jpg?v=1790383946", "mr": "models/cars/missile_commander_mr.jpg?v=1790383946"}, "leopard": {"base": "models/cars/night_leopard_base.jpg?v=1790383946", "normal": "models/cars/night_leopard_normal.jpg?v=1790383946", "mr": "models/cars/night_leopard_mr.jpg?v=1790383946"}, "trout": {"base": "models/cars/trout_protocol_base.jpg?v=1790383946", "normal": "models/cars/trout_protocol_normal.jpg?v=1790383946", "mr": "models/cars/trout_protocol_mr.jpg?v=1790383946"}};
"use strict";
// ===== UTILITIES =====
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
let RNG=mulberry32(1);
function seed(s){RNG=mulberry32(s);}
const rnd=()=>RNG(); const rr=(a,b)=>a+(b-a)*RNG(); const pick=a=>a[Math.floor(RNG()*a.length)];
const NoiseP=new Uint8Array(512);(()=>{const r=mulberry32(99);const p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}for(let i=0;i<512;i++)NoiseP[i]=p[i&255];})();
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y);const xf=x-xi,yf=y-yi;const h=(i,j)=>NoiseP[(NoiseP[(xi+i)&255]+yi+j)&255]/255;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return lerp(lerp(h(0,0),h(1,0),u),lerp(h(0,1),h(1,1),u),v);}
function fbm(x,y,o=4){let s=0,a=0.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);f*=2.03;a*=0.5;}return s;}
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;}
function ordinal(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function ordSuffix(n){return ordinal(n).replace(/^\d+/,'');}
function fmtTime(t){ if(t==null||!isFinite(t)) return '--:--.---'; const m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(3); }
function canvasTex(w,h,draw,opts={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c); if(opts.srgb!==false) t.encoding=THREE.sRGBEncoding;
  t.anisotropy=opts.aniso||4; if(opts.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}
  if(opts.clampU){t.wrapS=THREE.ClampToEdgeWrapping;}
  return t;
}
function noiseFill(g,w,h,base,amt,n=0.5){
  g.fillStyle=base; g.fillRect(0,0,w,h);
  const id=g.getImageData(0,0,w,h),d=id.data;
  for(let i=0;i<d.length;i+=4){const r=(Math.random()-0.5)*amt;d[i]+=r;d[i+1]+=r;d[i+2]+=r;}
  g.putImageData(id,0,0);
}
// merge simple non-indexed/indexed geometries (position/normal/uv) into one
function mergeGeos(list){
  let total=0; const parts=list.map(g=>{g=g.index?g.toNonIndexed():g; total+=g.attributes.position.count; return g;});
  const pos=new Float32Array(total*3),nor=new Float32Array(total*3),uv=new Float32Array(total*2),col=new Float32Array(total*3);
  let o=0; const hasCol=parts.some(p=>p.attributes.color);
  parts.forEach(g=>{const n=g.attributes.position.count; pos.set(g.attributes.position.array,o*3);
    if(g.attributes.normal) nor.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv) uv.set(g.attributes.uv.array,o*2);
    if(hasCol){ if(g.attributes.color) col.set(g.attributes.color.array,o*3); else for(let i=0;i<n*3;i++) col[o*3+i]=1; }
    o+=n;});
  const G=new THREE.BufferGeometry(); G.setAttribute('position',new THREE.BufferAttribute(pos,3)); G.setAttribute('normal',new THREE.BufferAttribute(nor,3)); G.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  if(hasCol) G.setAttribute('color',new THREE.BufferAttribute(col,3));
  return G;
}
function tintGeo(g,c){ g=g.index?g.toNonIndexed():g; const n=g.attributes.position.count; const a=new Float32Array(n*3); const col=new THREE.Color(c); for(let i=0;i<n;i++){a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b;} g.setAttribute('color',new THREE.BufferAttribute(a,3)); return g; }
const Store={
  get(k,d){try{const v=localStorage.getItem('rydens_'+k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('rydens_'+k,JSON.stringify(v));}catch(e){}}
};

// ===== TRACK DEFINITIONS =====
// points: [x, z, y, width]
const TRACK_DATA = [
{
  id:'sweet', name:'Sweet Justice Circuit', place:'Compton Heights',
  blurb:'Sun-baked city blocks, palm-lined boulevards and a hilltop crest jump past the donut shop.',
  theme:'city', laps:3,
  points:[
    [0,-40,0,22],[0,60,0,22],[0,170,0,22],[6,240,0,20],[45,275,0,18],[120,282,1,16],
    [175,272,2,14],[205,292,3,14],[240,282,4,15],[300,282,6,16],[345,260,8,16],[362,215,9,16],
    [362,165,10,16],[360,110,6,17],[352,55,1,18],[330,15,0,18],[352,-30,0,17],[330,-72,0,16],
    [290,-115,0,15],[235,-135,0,13],[175,-128,0,13],[125,-140,0,13],[80,-160,0,14],[38,-150,0,16],[10,-110,0,20]
  ],
  jumps:[{cp:12,f:0.55,len:14,h:2.6,gap:0}],
  boosts:[{cp:1,f:0.4,lat:0},{cp:13,f:0.3,lat:-3},{cp:20,f:0.5,lat:0}],
  items:[{cp:2,f:0.3},{cp:15,f:0.5},{cp:21,f:0.2}],
  medians:[{cp:0,f:0.2,len:120,w:3}],
},
{
  id:'mesa', name:'Mojave Mesa Run', place:'Route 99 Desert',
  blurb:'Endless yellow lines, a mesa-top hairpin, a narrow slot canyon and a leap over the dry wash.',
  theme:'desert', laps:3,
  points:[
    [0,-40,0,20],[0,120,0,20],[0,300,0,20],[20,430,1,19],[90,520,3,18],[200,550,5,17],[300,520,8,16],
    [360,450,12,16],[385,380,14,17],[360,330,14,17],[310,340,13,15],[265,370,11,14],[215,330,8,13],
    [200,260,5,13],[205,190,3,16],[200,110,2,18],[230,40,2,18],[290,-30,2,17],[270,-110,1,16],[200,-150,0,17],
    [120,-160,0,18],[50,-140,0,19],[12,-95,0,20]
  ],
  jumps:[{cp:14,f:0.45,len:12,h:3.2,gap:14}],
  boosts:[{cp:1,f:0.6,lat:4},{cp:14,f:0.15,lat:0},{cp:18,f:0.5,lat:0}],
  items:[{cp:2,f:0.2},{cp:10,f:0.5},{cp:19,f:0.5}],
  medians:[],
},
{
  id:'coast', name:'Pacifica Cliffs', place:'Pacifica Coast Highway',
  blurb:'Golden-hour cliff road above the surf: tunnel, lighthouse, a downhill hairpin and blind crests.',
  theme:'coast', laps:3,
  points:[
    [0,-40,2,17],[0,100,3,17],[-20,210,6,16],[5,290,9,15],[-18,360,11,15],[4,430,12,15],[0,520,14,16],
    [-12,610,18,16],[-5,690,17,16],[35,730,15,16],[80,705,13,16],[95,640,11,17],[90,550,8,17],
    [120,470,6,16],[140,380,8,16],[120,290,10,16],[140,200,6,17],[120,110,3,18],[100,20,2,18],[80,-60,2,17],[40,-90,2,17],[10,-75,2,17]
  ],
  jumps:[{cp:15,f:0.6,len:12,h:2.2,gap:0}],
  boosts:[{cp:1,f:0.5,lat:0},{cp:12,f:0.5,lat:3},{cp:17,f:0.5,lat:0}],
  items:[{cp:2,f:0.7},{cp:11,f:0.3},{cp:18,f:0.4}],
  tunnels:[{cp:5,f:0.2,len:70}],
  medians:[],
},
{
  id:'neon', name:'Neon Foundry Nights', place:'Harbor Steelworks',
  blurb:'Rain-slick midnight streets through a glowing steel mill, neon rails, and a jump across the canal.',
  theme:'night', laps:3,
  points:[
    [0,-40,0,22],[0,90,0,22],[0,200,0,21],[25,265,0,18],[85,285,0,16],[150,265,1,15],[180,215,2,15],
    [225,195,2,15],[275,215,2,15],[320,255,3,16],[380,240,3,17],[400,180,2,17],[395,100,1,18],[400,20,1,18],
    [380,-50,1,17],[320,-80,1,15],[270,-50,1,14],[220,-80,1,14],[170,-60,1,15],[120,-100,0,16],[60,-120,0,18],[18,-90,0,20]
  ],
  jumps:[{cp:12,f:0.35,len:12,h:3.0,gap:14}],
  boosts:[{cp:1,f:0.3,lat:-4},{cp:1,f:0.3,lat:4},{cp:12,f:0.1,lat:0},{cp:19,f:0.5,lat:0}],
  items:[{cp:2,f:0.5},{cp:9,f:0.5},{cp:17,f:0.5}],
  medians:[{cp:12,f:0.8,len:90,w:3}],
},
{
  id:'alondra', name:'Alondra Boulevard', place:'Compton, CA',
  blurb:'The hardest run in town. Narrow dusk streets, a hairpin, a crest jump — and three blocks where locals open fire on anything that passes.',
  theme:'city', sky:'dusk', laps:3, hard:true,
  points:[
    [0,-40,0,18],[0,80,0,17],[0,190,0,15],[10,245,0,13],[55,262,0,13],[120,262,0,13],
    [170,250,1,12],[205,270,1,12],[250,262,2,13],[290,235,3,13],[300,180,4,13],[300,110,6,13],
    [295,50,3,13],[270,10,1,12],[230,5,0,12],[215,40,0,12],[190,70,0,12],[150,70,0,13],
    [120,40,0,13],[120,-20,0,13],[140,-70,0,13],[130,-120,0,12],[90,-145,0,12],[50,-130,0,13],
    [25,-160,0,13],[-10,-150,0,15],[-15,-100,0,17]
  ],
  jumps:[{cp:11,f:0.5,len:13,h:2.4,gap:0}],
  boosts:[{cp:1,f:0.5,lat:0},{cp:10,f:0.3,lat:0},{cp:19,f:0.4,lat:0}],
  items:[{cp:2,f:0.2},{cp:12,f:0.6},{cp:20,f:0.3}],
  medians:[{cp:0,f:0.3,len:90,w:2.5}],
  shooters:[{cp:4,f:0.3},{cp:13,f:0.1},{cp:22,f:0.2}],
},
{
  id:'country', name:'Honky Tonk Highway', place:'Red Dirt Country, OK',
  blurb:'Red dirt, rolling hills and a covered bridge, all circling the Red Solo Cup monument. A creek jump, a church on the hill and one very honest donkey sign.',
  theme:'country', laps:3,
  points:[
    [0,-60,0,17],[0,60,1,17],[2,165,3,16],[-18,235,5,15],[-80,265,6,14],[-150,255,5,14],
    [-205,212,4,14],[-222,148,3,13],[-232,70,1,13],[-248,-10,0,13],[-236,-100,0,13],[-196,-165,1,13],
    [-128,-196,3,13],[-62,-178,6,14],[-8,-205,4,14],[55,-240,2,13],[118,-232,0,13],[170,-182,0,13],
    [214,-108,2,13],[236,-28,4,14],[214,48,6,14],[156,84,6,13],[104,58,4,13],[82,4,2,13],
    [70,-58,1,14],[52,-118,0,15],[16,-138,0,16],[-6,-108,0,17]
  ],
  jumps:[{cp:13,f:0.2,len:14,h:2.8,gap:0},{cp:16,f:0.15,len:12,h:3.2,gap:15}],
  boosts:[{cp:1,f:0.45,lat:0},{cp:8,f:0.5,lat:-3},{cp:15,f:0.55,lat:0},{cp:19,f:0.4,lat:3}],
  items:[{cp:2,f:0.3},{cp:9,f:0.6},{cp:14,f:0.5},{cp:20,f:0.5},{cp:25,f:0.3}],
  medians:[],
  tunnels:[{cp:9,f:0.75,len:44}],
  creek:[[-420,-60],[-236,-78],[-120,-120],[40,-190],[148,-210],[320,-250],[520,-300]],
  monument:{x:-95,z:120},
},
];
if (typeof module!=='undefined') module.exports = {TRACK_DATA};

// ===== TRACK PATH (shared by physics, AI, rendering) =====
function smooth01(t){ t=Math.max(0,Math.min(1,t)); return t*t*(3-2*t); }
function buildTrackPath(def){
  const V3 = THREE.Vector3;
  const cps = def.points.map(p=>new V3(p[0],p[2],p[1]));
  const curve = new THREE.CatmullRomCurve3(cps,true,'centripetal',0.5);
  const L = curve.getLength();
  const SP = 2; // meters per sample
  const N = Math.round(L/SP);
  const raw = curve.getSpacedPoints(N); raw.pop();
  const spacing = L/N;
  const P = { def, N, L, spacing,
    x:new Float32Array(N), z:new Float32Array(N), y:new Float32Array(N),
    tx:new Float32Array(N), tz:new Float32Array(N), rx:new Float32Array(N), rz:new Float32Array(N),
    w:new Float32Array(N), wl:new Float32Array(N), wr:new Float32Array(N),
    curv:new Float32Array(N), gap:new Uint8Array(N), tunnel:new Uint8Array(N), median:new Float32Array(N),
    slope:new Float32Array(N), s:new Float32Array(N), cpIdx:[] };
  for(let i=0;i<N;i++){ P.x[i]=raw[i].x; P.z[i]=raw[i].z; P.y[i]=raw[i].y; P.s[i]=i*spacing; }
  // control point sample indices
  let last=0;
  for(let c=0;c<cps.length;c++){
    let best=-1,bd=1e18;
    for(let k=0;k<N;k++){ const i=(last+k)%N; if(c===0 && k>N/2) break;
      const dx=P.x[i]-cps[c].x, dz=P.z[i]-cps[c].z, d=dx*dx+dz*dz; if(d<bd){bd=d;best=i;} if(c>0 && k>N*0.4) break; }
    if(c===0) best=0;
    P.cpIdx.push(best); last=best;
  }
  const idxAt=(cp,f)=>{ const a=P.cpIdx[cp%cps.length]; let b=P.cpIdx[(cp+1)%cps.length]; if(b<=a) b+=N; return Math.round(a+(b-a)*f)%N; };
  P.idxAt=idxAt;
  // widths
  for(let c=0;c<cps.length;c++){
    const a=P.cpIdx[c]; let b=P.cpIdx[(c+1)%cps.length]; if(b<=a) b+=N;
    const w0=def.points[c][3], w1=def.points[(c+1)%cps.length][3];
    for(let i=a;i<=b;i++) P.w[i%N]=w0+(w1-w0)*smooth01((i-a)/Math.max(1,b-a));
  }
  // tangents
  for(let i=0;i<N;i++){
    const a=(i-1+N)%N,b=(i+1)%N; let dx=P.x[b]-P.x[a], dz=P.z[b]-P.z[a]; const l=Math.hypot(dx,dz)||1;
    P.tx[i]=dx/l; P.tz[i]=dz/l; P.rx[i]=-dz/l; P.rz[i]=dx/l;
  }
  // smooth heights a little
  for(let pass=0;pass<3;pass++){ const t=P.y.slice(); for(let i=0;i<N;i++){ P.y[i]=(t[(i-2+N)%N]+t[(i-1+N)%N]+t[i]+t[(i+1)%N]+t[(i+2)%N])/5; } }
  // jumps / kickers
  (def.jumps||[]).forEach(j=>{
    const i0=idxAt(j.cp,j.f); const rl=Math.round(j.len/spacing);
    for(let k=0;k<=rl;k++){ const i=(i0+k)%N; const t=k/rl; P.y[i]+= j.h*Math.pow(t,1.3); }
    const top=(i0+rl)%N;
    if(j.gap>0){ const gl=Math.round(j.gap/spacing); for(let k=1;k<=gl;k++) P.gap[(top+k)%N]=1; }
    else { for(let k=1;k<=3;k++){ const i=(top+k)%N; P.y[i]+= j.h*(1-k/3)*0.35; } }
    j.i0=i0; j.top=top;
  });
  // curvature (signed: + turning right)
  const K=4;
  for(let i=0;i<N;i++){
    const a=(i-K+N)%N,b=(i+K)%N;
    const ang=Math.atan2(P.tx[a]*P.tz[b]-P.tz[a]*P.tx[b], P.tx[a]*P.tx[b]+P.tz[a]*P.tz[b]);
    P.curv[i]= -ang/(2*K*spacing); // left turn => positive (heading increases)
  }
  for(let i=0;i<N;i++){ const b=(i+1)%N; P.slope[i]=(P.y[b]-P.y[i])/spacing; }
  // walls
  const SH = def.shoulder||4;
  for(let i=0;i<N;i++){
    let wl=P.w[i]/2+SH, wr=P.w[i]/2+SH;
    const c=P.curv[i]; if(Math.abs(c)>1e-4){ const R=1/Math.abs(c); if(c>0) wr=Math.min(wr,R*0.8); else wl=Math.min(wl,R*0.8); }
    P.wl[i]=Math.max(wl,P.w[i]/2+0.8); P.wr[i]=Math.max(wr,P.w[i]/2+0.8);
  }
  (def.tunnels||[]).forEach(t=>{ const i0=idxAt(t.cp,t.f); const n=Math.round(t.len/spacing); for(let k=0;k<n;k++){ const i=(i0+k)%N; P.tunnel[i]=1; P.wl[i]=Math.min(P.wl[i],P.w[i]/2+1.2); P.wr[i]=Math.min(P.wr[i],P.w[i]/2+1.2);} t.i0=i0; t.n=n; });
  (def.medians||[]).forEach(m=>{ const i0=idxAt(m.cp,m.f); const n=Math.round(m.len/spacing); for(let k=0;k<n;k++){ const i=(i0+k)%N; const e=Math.min(k,n-k)/6; P.median[i]=m.w/2*Math.min(1,e);} m.i0=i0; m.n=n; });
  // helpers
  P.nearest=function(x,z,hint,win){
    let best=hint,bd=1e18;
    if(hint<0){ for(let i=0;i<N;i++){ const dx=x-P.x[i],dz=z-P.z[i],d=dx*dx+dz*dz; if(d<bd){bd=d;best=i;} } return best; }
    for(let k=-win;k<=win;k++){ const i=(hint+k+N)%N; const dx=x-P.x[i],dz=z-P.z[i],d=dx*dx+dz*dz; if(d<bd){bd=d;best=i;} }
    return best;
  };
  // project to local frame: returns {i, t (0..1 toward i+1), lat, h (road height), along}
  P.project=function(x,z,i,out){
    const j=(i+1)%N; const ax=P.x[i],az=P.z[i];
    let sx=P.x[j]-ax, sz=P.z[j]-az; const sl=sx*sx+sz*sz;
    let t=((x-ax)*sx+(z-az)*sz)/sl;
    let ii=i;
    if(t<0){ ii=(i-1+N)%N; const bx=P.x[ii],bz=P.z[ii]; sx=ax-bx; sz=az-bz; t=((x-bx)*sx+(z-bz)*sz)/(sx*sx+sz*sz); }
    t=Math.max(0,Math.min(1,t));
    const k=(ii+1)%N;
    const cx=P.x[ii]+(P.x[k]-P.x[ii])*t, cz=P.z[ii]+(P.z[k]-P.z[ii])*t;
    const rx=P.rx[ii]+(P.rx[k]-P.rx[ii])*t, rz=P.rz[ii]+(P.rz[k]-P.rz[ii])*t;
    out.i=ii; out.t=t; out.lat=(x-cx)*rx+(z-cz)*rz;
    out.h=P.y[ii]+(P.y[k]-P.y[ii])*t; out.along=(ii+t)*spacing;
    out.wl=P.wl[ii]; out.wr=P.wr[ii]; out.w=P.w[ii]; out.gap=P.gap[ii]||P.gap[k]; out.median=P.median[ii];
    out.tx=P.tx[ii]; out.tz=P.tz[ii]; out.rx=rx; out.rz=rz; out.slope=P.slope[ii];
    return out;
  };
  return P;
}
if (typeof module!=='undefined') module.exports={buildTrackPath,smooth01};

// ===== VEHICLE ROSTER (based on the Ryden's Racers trailer) =====
const VEHICLES=[
 {id:'duck',driver:'Nic',name:'Duck Plasma',cls:'Rubber duck on wheels',desc:'A giant yellow rubber duck bolted onto a pocket-sized hatchback chassis. Squeaky, bouncy, surprisingly quick.',tag:'Quack. Quack. Gone.',body:'duckmini',livery:'duckskin',rim:0xd8d8d8,stats:{speed:9,accel:7,handling:6,drift:8,weight:4}},
 {id:'gt44',driver:'Eli',name:'GT40',cls:'Endurance racer, 1966',desc:'Low, loud and built to win the long race. Twin stripes, zero apologies.',tag:'Old money. New records.',body:'gt',livery:'stripes',num:40,rim:0xcfd3d6,stats:{speed:8,accel:8,handling:8,drift:6,weight:5}},
 {id:'donut',driver:'Donut',name:'Donut Patrol',cls:'Pursuit cruiser',desc:'Sprinkle-coated interceptor. Its plate says GLAZE EM, and it means it.',tag:'Protect. Serve. Snack.',body:'coupe',livery:'sprinkles',rim:0xf4f4f4,plate:'GLAZE EM',stats:{speed:7,accel:9,handling:8,drift:7,weight:5}},
 {id:'missile',driver:'Ethan',name:'Missile Commander',cls:'Heavy-duty pickup',desc:'Lifted gunmetal pickup with warning-yellow stripes, a grille full of missiles and rocket-fin bed rails.',tag:'Right of way, always.',body:'truck',livery:'missile',rim:0x1c1c1c,stats:{speed:7,accel:6,handling:5,drift:6,weight:10}},
 {id:'brcc',driver:'JT',name:'BRCC',cls:'Rally hatchback',desc:'Black Rifle Coffee rally car in black-and-gold camo. Short, stiff and happiest sideways.',tag:'Fueled by dark roast.',body:'gtcoupe',livery:'goldcamo',num:15,rim:0x1a1a1a,stats:{speed:7,accel:9,handling:8,drift:9,weight:4}},
 {id:'fdc',driver:'Chris',name:'Firearms Direct Club',cls:'Desert pickup',desc:'Sand-tan Firearms Direct Club pickup with a roll bar and a mount in the bed. Tough, heavy and hard to push around.',tag:'Members only.',body:'truck',livery:'goldcamo',rim:0x222222,stats:{speed:7,accel:6,handling:6,drift:5,weight:9}},
 {id:'hellcat',driver:'CordIsLoud',name:'Colonial Hellcat',cls:'Supercharged muscle car',desc:'Navy-blue muscle car with twin white stripes, a 13-star flag and 1776 on the doors. Monster straight-line speed; it takes some muscle in the corners.',tag:'Loud since 1776.',body:'gtcoupe',livery:'stripes',num:76,rim:0x151515,stats:{speed:10,accel:8,handling:5,drift:7,weight:7}},
 {id:'bpd',driver:'Rich',name:'BPD 69',cls:'Detective cruiser',desc:'Unmarked, unbothered. A boxy 80s cruiser that corners like it has a warrant.',tag:'Case closed at 180.',body:'sedan',livery:'filigree',rim:0x9aa0a6,plate:'BPD 69',stats:{speed:8,accel:7,handling:7,drift:7,weight:7}},
 {id:'concord',driver:'Brandon',name:'Concordance',cls:'Luxury limousine',desc:'Silk-black stretch luxury sedan of a decorated war hero and soon-to-be congressman. Gold crossed-rifle crests, AK-47 hood ornament, flags on the fenders.',tag:'Served. Now serving.',body:'yacht',livery:'silkblack',rim:0x111111,plate:'HERO 1',stats:{speed:8,accel:6,handling:6,drift:9,weight:8}},
 {id:'trout',driver:'Trout',name:'Trout Protocol',cls:'Rainbow trout hypercar',desc:'A mid-engine hypercar that is basically a rainbow trout: speckled olive back, pink stripe, fins, gills and a tail.',tag:'Swims upstream at 300.',body:'hyper',livery:'trout',rim:0x2b2b2b,stats:{speed:9,accel:8,handling:7,drift:5,weight:4}},
 {id:'leopard',driver:'Pix',name:'Night Leopard',cls:'Turbo GT coupe',desc:'Rosette-printed street GT that stalks the inside line at every corner.',tag:'Spots you from the apex.',body:'gtcoupe',livery:'leopard',rim:0x1c1c1c,stats:{speed:8,accel:8,handling:8,drift:7,weight:5}},
];
function vehiclePhysics(v){
  const s=v.stats;
  return { top:44+s.speed*1.05, accel:15+s.accel*1.5, steer:2.25+s.handling*0.07, grip:6.5+s.handling*0.45,
    drift:0.75+s.drift*0.06, mass:0.8+s.weight*0.12 };
}
const BODIES={
 proto:{L:4.7,W:2.0,ride:0.16,wr:0.36,ww:0.34,aF:1.45,aR:-1.35,nose:0.36,bev:0.14,
   up:[['q',2.3,0.66,1.55,0.8],['q',1.1,0.8,0.72,0.72],['l',-0.8,0.8],['q',-1.7,0.98,-2.35,0.88],['l',-2.35,0.45]],
   cab:[[0.76,0.72],[0.12,1.1],[-0.72,1.08],[-1.1,0.8]],cabW:0.6},
 gt:{L:4.3,W:1.96,ride:0.14,wr:0.35,ww:0.34,aF:1.35,aR:-1.3,nose:0.32,bev:0.12,
   up:[['q',2.15,0.64,1.5,0.72],['l',0.82,0.7],['l',-1.25,0.9],['q',-2.05,0.96,-2.15,0.8],['l',-2.15,0.4]],
   cab:[[0.86,0.7],[0.2,1.06],[-0.55,1.06],[-1.25,0.9]],cabW:0.7},
 coupe:{L:4.3,W:1.92,ride:0.2,wr:0.36,ww:0.32,aF:1.35,aR:-1.35,nose:0.45,bev:0.14,
   up:[['q',2.15,0.72,1.6,0.8],['l',0.66,0.86],['l',-1.25,0.95],['q',-2.15,0.98,-2.15,0.7],['l',-2.15,0.36]],
   cab:[[0.7,0.86],[0.05,1.28],[-0.72,1.28],[-1.28,0.95]],cabW:0.74},
 truck:{L:5.5,W:2.3,ride:0.62,wr:0.6,ww:0.46,aF:1.8,aR:-1.8,nose:1.0,bev:0.1,
   up:[['l',2.75,1.38],['l',1.25,1.48],['l',-0.55,1.48],['l',-0.62,1.34],['l',-2.75,1.34],['l',-2.75,0.3]],
   cab:[[1.2,1.48],[0.62,2.28],[-0.5,2.28],[-0.55,1.48]],cabW:0.86},
 sedan:{L:4.8,W:1.96,ride:0.24,wr:0.36,ww:0.32,aF:1.5,aR:-1.45,nose:0.72,bev:0.07,
   up:[['l',2.4,0.92],['l',1.0,0.97],['l',-1.35,0.97],['l',-2.4,0.95],['l',-2.4,0.42]],
   cab:[[0.98,0.97],[0.38,1.46],[-1.0,1.46],[-1.36,0.97]],cabW:0.8},
 yacht:{L:5.9,W:2.04,ride:0.2,wr:0.38,ww:0.34,aF:2.0,aR:-1.85,nose:0.66,bev:0.14,
   up:[['q',2.95,0.88,2.5,0.92],['l',1.05,0.95],['l',-1.85,0.98],['l',-2.6,0.96],['q',-2.95,0.95,-2.95,0.7],['l',-2.95,0.36]],
   cab:[[1.02,0.95],[0.45,1.4],[-1.3,1.4],[-1.85,0.98]],cabW:0.8},
 hyper:{L:4.5,W:2.06,ride:0.12,wr:0.37,ww:0.36,aF:1.4,aR:-1.4,nose:0.28,bev:0.12,
   up:[['l',2.25,0.42],['q',1.6,0.56,0.95,0.72],['l',-1.5,0.85],['l',-2.25,0.8],['l',-2.25,0.36]],
   cab:[[0.96,0.72],[0.12,1.1],[-0.6,1.08],[-1.5,0.85]],cabW:0.64},
 custom:{L:4.6,W:2.08,ride:0.14,wr:0.37,ww:0.36,aF:1.45,aR:-1.45,nose:0.34,bev:0.14,
   up:[['q',2.3,0.6,1.7,0.72],['l',0.55,0.8],['l',-1.4,0.92],['q',-2.3,0.95,-2.3,0.62],['l',-2.3,0.34]],
   cab:[[0.6,0.8],[-0.1,1.2],[-0.9,1.18],[-1.55,0.92]],cabW:0.7},
 duckmini:{L:3.7,W:1.9,ride:0.2,wr:0.36,ww:0.32,aF:1.2,aR:-1.2,nose:0.6,bev:0.1,custom:'duck',
   up:[['l',1.85,0.9],['l',-1.85,0.9],['l',-1.85,0.4]],
   cab:[[0.8,0.9],[0.4,1.3],[-0.8,1.3],[-1.2,0.9]],cabW:0.7},
 gtcoupe:{L:4.4,W:1.96,ride:0.16,wr:0.36,ww:0.33,aF:1.38,aR:-1.35,nose:0.4,bev:0.13,
   up:[['q',2.2,0.64,1.5,0.73],['l',0.78,0.8],['l',-1.5,0.88],['l',-1.85,0.87],['q',-2.2,0.9,-2.2,0.68],['l',-2.2,0.35]],
   cab:[[0.8,0.8],[0.05,1.2],[-0.65,1.18],[-1.5,0.88]],cabW:0.72},
};

// ===== LIVERIES + PROCEDURAL CAR MODELS =====
const LIVERY_CACHE={};
function liveryTexture(kind){
  if(LIVERY_CACHE[kind]) return LIVERY_CACHE[kind];
  const S=512, R=mulberry32(kind.length*977+kind.charCodeAt(0));
  const r=(a,b)=>a+(b-a)*R();
  const t=canvasTex(S,S,(g)=>{
    const swirl=(col,lw,n,sz)=>{ g.strokeStyle=col; g.lineWidth=lw; g.lineCap='round';
      for(let i=0;i<n;i++){ let x=r(0,S),y=r(0,S),a=r(0,TAU),rad=r(sz*0.5,sz); g.beginPath(); g.moveTo(x,y);
        for(let k=0;k<26;k++){ a+=r(0.15,0.45); rad*=0.93; x+=Math.cos(a)*rad*0.35; y+=Math.sin(a)*rad*0.35; g.lineTo(x,y);} g.stroke(); } };
    if(kind==='plasma'){
      noiseFill(g,S,S,'#f2b705',18);
      const grd=g.createLinearGradient(0,0,S,S); grd.addColorStop(0,'rgba(255,230,120,0.4)'); grd.addColorStop(1,'rgba(230,120,0,0.25)'); g.fillStyle=grd; g.fillRect(0,0,S,S);
      for(let i=0;i<9;i++){ let x=r(0,S),y=r(0,S); g.shadowColor='#bff6ff'; g.shadowBlur=10;
        g.strokeStyle='rgba(255,255,255,0.95)'; g.lineWidth=r(1.5,3.5); g.beginPath(); g.moveTo(x,y);
        let a=r(0,TAU); for(let k=0;k<22;k++){ a+=r(-0.9,0.9); x+=Math.cos(a)*r(8,20); y+=Math.sin(a)*r(8,20); g.lineTo(x,y);
          if(R()<0.15){ g.stroke(); g.beginPath(); g.moveTo(x,y); } }
        g.stroke(); }
      g.shadowBlur=0;
    } else if(kind==='stripes'){
      noiseFill(g,S,S,'#c3121c',12);
      g.fillStyle='#f4f1ea'; g.fillRect(0,S*0.40,S,S*0.07); g.fillRect(0,S*0.53,S,S*0.07);
    } else if(kind==='sprinkles'){
      noiseFill(g,S,S,'#ff8cc0',10);
      const cols=['#ffffff','#ffe14d','#3fd0ff','#7a5cff','#ff3b6b','#6bff8a','#ff9a3c'];
      for(let i=0;i<700;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(r(0,TAU)); g.fillStyle=cols[i%cols.length];
        const l=r(9,15); g.beginPath(); g.moveTo(-l/2,-2.5); g.lineTo(l/2,-2.5); g.arc(l/2,0,2.5,-Math.PI/2,Math.PI/2); g.lineTo(-l/2,2.5); g.arc(-l/2,0,2.5,Math.PI/2,Math.PI*1.5); g.fill(); g.restore(); }
    } else if(kind==='goldcamo'){
      noiseFill(g,S,S,'#141414',10);
      for(let i=0;i<34;i++){ g.fillStyle=R()<0.5?'rgba(201,162,58,0.85)':'rgba(60,52,30,0.9)'; g.beginPath(); let x=r(0,S),y=r(0,S);
        for(let k=0;k<9;k++){ const a=k/9*TAU; const rad=r(14,40); const px=x+Math.cos(a)*rad, py=y+Math.sin(a)*rad; k?g.lineTo(px,py):g.moveTo(px,py);} g.fill(); }
      swirl('rgba(230,190,90,0.9)',2,26,60);
    } else if(kind==='filigree'){
      noiseFill(g,S,S,'#2d3137',10); swirl('rgba(212,170,80,0.75)',2.2,40,70); swirl('rgba(230,225,210,0.35)',1,30,40);
    } else if(kind==='goldfiligree'){
      noiseFill(g,S,S,'#0d0d10',6); swirl('rgba(225,180,70,0.95)',3,34,90); swirl('rgba(255,215,120,0.6)',1.2,50,50);
    } else if(kind==='scales'){
      const grd=g.createLinearGradient(0,0,0,S); grd.addColorStop(0,'#ff7a1f'); grd.addColorStop(0.5,'#ff4a1a'); grd.addColorStop(1,'#d11f2a'); g.fillStyle=grd; g.fillRect(0,0,S,S);
      const sz=32; for(let y=-1;y<S/sz*2+1;y++) for(let x=-1;x<S/sz+1;x++){ const cx=x*sz+(y%2?sz/2:0), cy=y*sz/2;
        g.strokeStyle='rgba(90,10,10,0.55)'; g.lineWidth=2.5; g.beginPath(); g.arc(cx,cy,sz/2,0.15*Math.PI,0.85*Math.PI); g.stroke();
        g.fillStyle='rgba(255,220,120,0.18)'; g.beginPath(); g.arc(cx,cy+4,sz/4,0,TAU); g.fill(); }
      for(let i=0;i<60;i++){ g.fillStyle='rgba(40,10,20,0.7)'; g.beginPath(); g.arc(r(0,S),r(0,S),r(2,5),0,TAU); g.fill(); }
    } else if(LIVERY_EXTRA[kind]){ LIVERY_EXTRA[kind](g,S,r);
    } else if(kind==='leopard'){
      noiseFill(g,S,S,'#d4a045',14);
      for(let i=0;i<120;i++){ const x=r(0,S),y=r(0,S),s=r(9,17); g.fillStyle='#2a170b';
        for(let k=0;k<5;k++){ const a=k/5*TAU+r(-0.3,0.3); g.beginPath(); g.ellipse(x+Math.cos(a)*s,y+Math.sin(a)*s,s*0.45,s*0.3,a+1.57,0,TAU); g.fill(); }
        g.fillStyle='#9a6024'; g.beginPath(); g.arc(x,y,s*0.6,0,TAU); g.fill(); }
      for(let i=0;i<120;i++){ g.fillStyle='#2a170b'; g.beginPath(); g.arc(r(0,S),r(0,S),r(2,5),0,TAU); g.fill(); }
    }
  },{repeat:true,aniso:8});
  LIVERY_CACHE[kind]=t; return t;
}
function decalTex(draw,w=128,h=128){ return canvasTex(w,h,draw); }
let SHARED_CAR_MATS=null;
function carSharedMats(){
  if(SHARED_CAR_MATS) return SHARED_CAR_MATS;
  SHARED_CAR_MATS={
    glass:new THREE.MeshPhysicalMaterial({color:0x0a0c12,metalness:0.2,roughness:0.08,clearcoat:1,clearcoatRoughness:0.05}),
    tire:new THREE.MeshStandardMaterial({color:0x151515,roughness:0.9}),
    trim:new THREE.MeshStandardMaterial({color:0x0e0e10,roughness:0.6,metalness:0.3}),
    chrome:new THREE.MeshStandardMaterial({color:0xe8e8ee,roughness:0.12,metalness:1}),
    gold:new THREE.MeshStandardMaterial({color:0xd4a33a,roughness:0.25,metalness:1}),
    head:new THREE.MeshBasicMaterial({color:0xfff4d6}),
    amber:new THREE.MeshBasicMaterial({color:0xffa31a}),
    shadow:new THREE.MeshBasicMaterial({map:canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,'rgba(0,0,0,0.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);}),transparent:true,depthWrite:false}),
  };
  return SHARED_CAR_MATS;
}
function setEnvOnCarMats(env){ const m=carSharedMats(); [m.glass,m.chrome,m.gold,m.trim].forEach(x=>{x.envMap=env;x.needsUpdate=true;}); }
function buildCarModel(v, env){
  const B=BODIES[v.body], M=carSharedMats();
  const root=new THREE.Group(); // positioned at ground contact, rotated by heading
  const chassis=new THREE.Group(); root.add(chassis); // pitch/roll/suspension
  const bodyMat=new THREE.MeshPhysicalMaterial({map:liveryTexture(v.livery),roughness:0.38,metalness:0.25,clearcoat:1,clearcoatRoughness:0.08,envMap:env||null,envMapIntensity:1.0});
  const mt=bodyMat.map;
  if(v.livery==='stripes'){ /* handled via uv trick */ }
  // lower body
  const s=new THREE.Shape(); const L=B.L, cy=Math.max(0.03,B.wr-B.ride), ra=B.wr+0.07;
  s.moveTo(-L/2,0.18); s.lineTo(-L/2+0.18,0);
  [B.aR,B.aF].forEach(ax=>{ s.lineTo(ax-ra,0); s.lineTo(ax-ra,cy); s.absarc(ax,cy,ra,Math.PI,0,true); s.lineTo(ax+ra,0); });
  s.lineTo(L/2-0.28,0); s.quadraticCurveTo(L/2,0.02,L/2,B.nose);
  B.up.forEach(c=>{ if(c[0]==='l') s.lineTo(c[1],c[2]); else s.quadraticCurveTo(c[1],c[2],c[3],c[4]); });
  s.lineTo(-L/2,0.18);
  const bt=B.bev, depth=B.W-2*bt;
  const g1=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:bt,bevelSize:bt*0.8,bevelSegments:6,curveSegments:24});
  g1.translate(0,0,-depth/2); g1.rotateY(-Math.PI/2); g1.computeVertexNormals();
  const body=new THREE.Mesh(g1,bodyMat); body.position.y=B.ride; body.castShadow=true; chassis.add(body);
  // texture scaling
  if(v.livery==='stripes'){ mt.repeat.set(0.35,1/B.W); mt.offset.set(0,1-1/B.W); }
  else mt.repeat.set(0.42,0.42);
  // cabin
  const cs=new THREE.Shape(); B.cab.forEach((p,i)=>i?cs.lineTo(p[0],p[1]):cs.moveTo(p[0],p[1]));
  const cw=B.W*B.cabW; const cb=0.08;
  const g2=new THREE.ExtrudeGeometry(cs,{depth:cw-2*cb,bevelEnabled:true,bevelThickness:cb,bevelSize:0.06,bevelSegments:2});
  g2.translate(0,0,-(cw-2*cb)/2); g2.rotateY(-Math.PI/2);
  const cab=new THREE.Mesh(g2,M.glass); cab.position.y=B.ride-0.02; cab.castShadow=true; chassis.add(cab);
  // roof panel in body material
  const rf=B.cab[1], rr_=B.cab[2]; const roofLen=rf[0]-rr_[0];
  const roof=new THREE.Mesh(new THREE.BoxGeometry(cw-0.12,0.07,roofLen*0.92),bodyMat);
  roof.position.set(0,B.ride+Math.max(rf[1],rr_[1])+0.02,(rf[0]+rr_[0])/2); chassis.add(roof);
  const roofY=roof.position.y+0.035;
  // wheels
  const wheels=[], steerPivots=[];
  const tireG=new THREE.CylinderGeometry(B.wr,B.wr,B.ww,32); tireG.rotateZ(Math.PI/2);
  const rimG=new THREE.CylinderGeometry(B.wr*0.64,B.wr*0.64,B.ww+0.03,14); rimG.rotateZ(Math.PI/2);
  const rimMat=new THREE.MeshStandardMaterial({color:v.rim,metalness:1,roughness:0.28,envMap:env||null});
  const spokeG=new THREE.BoxGeometry(B.ww+0.05,B.wr*1.1,0.07); const spokeMat=M.trim.clone(); const tireParts=[];
  const wx=B.W/2-B.ww/2+0.03;
  [[B.aF,1],[B.aF,-1],[B.aR,1],[B.aR,-1]].forEach(([z,side],k)=>{
    const pivot=new THREE.Group(); pivot.position.set(side*wx,B.wr,z); root.add(pivot);
    const wg=new THREE.Group(); pivot.add(wg);
    const t=new THREE.Mesh(tireG,M.tire); t.castShadow=true; wg.add(t); tireParts.push(wg);
    const rm=new THREE.Mesh(rimG,rimMat); wg.add(rm);
    for(let a=0;a<3;a++){ const sp=new THREE.Mesh(spokeG,spokeMat); sp.rotation.x=a*Math.PI/3; wg.add(sp); }
    wheels.push(wg); if(k<2) steerPivots.push(pivot);
  });
  // lights
  const tailMat=new THREE.MeshBasicMaterial({color:0xff1030});
  const hw=B.W/2-0.35, frontZ=L/2+bt*0.8-0.02, rearZ=-L/2-bt*0.8+0.02;
  const hy=B.ride+Math.min(B.nose,0.75)-0.1, ty=B.ride+0.45*(B.body==='truck'?1.6:1);
  const heads=[], tails=[];
  [-1,1].forEach(sd=>{
    const h=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.12,0.06),M.head); h.position.set(sd*hw,hy,frontZ); chassis.add(h); heads.push(h);
    const tl=new THREE.Mesh(new THREE.BoxGeometry(v.body==='gtcoupe'?0.24:0.46,0.13,0.06),tailMat); tl.position.set(sd*hw,Math.min(ty,B.ride+0.8),rearZ); chassis.add(tl); tails.push(tl);
    if(v.body==='gtcoupe'){ const t2=tl.clone(); t2.position.x=sd*(hw-0.3); chassis.add(t2); }
  });
  // exhausts & boost flames
  const flameMat=new THREE.MeshBasicMaterial({color:0x6ff3ff,transparent:true,opacity:0.85,blending:THREE.AdditiveBlending,depthWrite:false});
  const flames=[];
  const fg=new THREE.ConeGeometry(0.17,1,10,1,true); fg.translate(0,-0.5,0); fg.rotateX(-Math.PI/2);
  [-0.35,0.35].forEach(x=>{ const pipe=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.25,8),M.chrome); pipe.rotation.x=Math.PI/2; pipe.position.set(x,B.ride+0.18,rearZ-0.02); chassis.add(pipe);
    const f=new THREE.Mesh(fg,flameMat); f.position.set(x,B.ride+0.18,rearZ-0.12); f.scale.set(1,1,0.001); f.visible=false; chassis.add(f); flames.push(f); });
  // shadow blob
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(B.W*1.5,L*1.25),M.shadow); sh.rotation.x=-Math.PI/2; sh.position.y=0.04; sh.renderOrder=-1; root.add(sh);
  // decals
  const addDecal=(tex,w,h,pos,rotY,rotX=0)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.4,polygonOffset:true,polygonOffsetFactor:-2})); m.position.copy(pos); m.rotation.set(rotX,rotY,0,'YXZ'); chassis.add(m); return m; };
  if(v.num && !B.custom){ const tex=decalTex((g)=>{ g.fillStyle='#f5f2ea'; g.beginPath(); g.arc(64,64,60,0,TAU); g.fill(); g.fillStyle='#111'; g.font='bold 70px "Racing Sans One", Impact, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(v.num),64,70); });
    const sideX=B.W/2+0.004; addDecal(tex,0.62,0.62,new THREE.Vector3(sideX,B.ride+0.42,0.15),Math.PI/2); addDecal(tex,0.62,0.62,new THREE.Vector3(-sideX,B.ride+0.42,0.15),-Math.PI/2);
    const hood=B.up.find(c=>c[0]!=='x'); addDecal(tex,0.55,0.55,new THREE.Vector3(0,B.ride+0.76+0.015,1.25),0,-Math.PI/2+0.1); }
  if(v.plate){ const tex=decalTex((g)=>{ g.fillStyle='#f3f3f3'; g.fillRect(0,0,256,96); g.strokeStyle='#223'; g.lineWidth=6; g.strokeRect(4,4,248,88); g.fillStyle='#1a2a6c'; g.font='bold 52px "Chakra Petch", sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(v.plate,128,52); },256,96);
    addDecal(tex,0.62,0.23,new THREE.Vector3(0,B.ride+0.32,rearZ-0.01),Math.PI); }
  // per-vehicle extras
  const box=(w,h,d,mat,x,y,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; chassis.add(m); return m; };
  let lightbar=null;
  if(v.id==='donut'||v.id==='bpd'){
    const red=new THREE.MeshBasicMaterial({color:0xff1030}), blue=new THREE.MeshBasicMaterial({color:0x1a55ff});
    const zc=roof.position.z+(v.id==='donut'?0.25:0.1);
    box(1.25,0.1,0.28,M.trim,0,roofY+0.04,zc); const lr=box(0.55,0.14,0.26,red,-0.32,roofY+0.15,zc); const lb=box(0.55,0.14,0.26,blue,0.32,roofY+0.15,zc);
    lightbar={red,blue};
    if(v.id==='donut'){ // checker band + mini donut
      const chk=decalTex((g)=>{for(let x=0;x<16;x++)for(let y=0;y<2;y++){g.fillStyle=(x+y)%2?'#111':'#fafafa';g.fillRect(x*16,y*16,16,16);}},256,32);
      [-1,1].forEach(sd=>addDecal(chk,2.2,0.2,new THREE.Vector3(sd*(B.W/2+0.005),B.ride+0.66,-0.1),sd*Math.PI/2));
      const dn=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.1,10,20),new THREE.MeshStandardMaterial({color:0xff6fb0,roughness:0.5})); dn.rotation.x=Math.PI/2; dn.position.set(0,roofY+0.1,roof.position.z-0.45); chassis.add(dn);
    } else { box(1.7,0.3,0.1,M.trim,0,B.ride+0.35,frontZ+0.18); box(0.04,0.8,0.04,M.trim,-0.6,roofY+0.4,roof.position.z-0.5); }
  }
  if(v.id==='leopard'){ box(1.7,0.06,0.3,M.trim,0,B.ride+0.98,-2.05); }
  if(v.id==='bpd'){ box(0.2,0.2,0.05,M.chrome,-0.95,B.ride+1.1,0.95); }
  if(v.id==='gt44'){ box(1.6,0.05,0.2,M.trim,0,B.ride+0.95,-2.1); }
  const anims=styleCar(v,{B,M,chassis,root,body,bodyMat,roof,roofY,frontZ,rearZ,heads,tails,rimMat,spokeMat,tireParts,addDecal,box,env,L});
  // shield bubble
  const shield=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{t:{value:0},c:{value:new THREE.Color(0x3fe8ff)}},
    vertexShader:'varying vec3 n;varying vec3 vp;void main(){n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vp=-mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:'uniform float t;uniform vec3 c;varying vec3 n;varying vec3 vp;void main(){float f=1.-abs(dot(normalize(n),normalize(vp)));f=pow(f,2.2);float s=0.5+0.5*sin(t*6.+vp.y*6.);gl_FragColor=vec4(c*(f*1.4+0.08+0.12*s),1.);}'}));
  shield.scale.set(B.W*0.85,1.5,L*0.62); shield.position.y=B.ride+0.6; shield.visible=false; root.add(shield);
    const model={root,chassis,wheels,steerPivots,tailMat,flames,flameMat,shield,lightbar,bodyMat,dims:B,anims:anims.list};
  return (typeof CAR_GLTF!=='undefined'&&CAR_GLTF[v.id])?applyGlbModel(model,v,env):model;
}

// ===== CAR STYLING: reference-sheet details for each ride =====
const LIVERY_EXTRA={
  duckskin(g,S,r){ // rubber-duck yellow with electric-blue plasma veins
    noiseFill(g,S,S,'#f3b21a',16);
    for(let i=0;i<140;i++){ g.strokeStyle='rgba(150,90,0,0.18)'; g.lineWidth=1; g.beginPath(); let x=r(0,S),y=r(0,S); g.moveTo(x,y); for(let k=0;k<4;k++){ x+=r(-30,30); y+=r(-30,30); g.lineTo(x,y);} g.stroke(); }
    for(let i=0;i<8;i++){ let x=r(0,S),y=r(0,S),a=r(0,TAU); const pts=[[x,y]]; for(let k=0;k<26;k++){ a+=r(-0.8,0.8); x+=Math.cos(a)*r(7,16); y+=Math.sin(a)*r(7,16); pts.push([x,y]); }
      [[14,'rgba(40,200,255,0.25)'],[6,'rgba(60,220,255,0.7)'],[2,'rgba(230,255,255,1)']].forEach(([w,c])=>{ g.strokeStyle=c; g.lineWidth=w; g.lineJoin='round'; g.beginPath(); pts.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])); g.stroke(); });
      for(let b=0;b<3;b++){ const p=pts[Math.floor(r(3,pts.length-1))]; let bx=p[0],by=p[1],ba=r(0,TAU); g.strokeStyle='rgba(120,235,255,0.85)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(bx,by); for(let k=0;k<6;k++){ ba+=r(-0.9,0.9); bx+=Math.cos(ba)*r(5,11); by+=Math.sin(ba)*r(5,11); g.lineTo(bx,by);} g.stroke(); } }
  },
  racered(g,S,r){ noiseFill(g,S,S,'#c4101c',8); const gr=g.createLinearGradient(0,0,0,S); gr.addColorStop(0,'rgba(255,255,255,0.06)'); gr.addColorStop(1,'rgba(0,0,0,0.08)'); g.fillStyle=gr; g.fillRect(0,0,S,S); },
  frosting(g,S,r){ // glossy pink icing, dark sprinkles
    noiseFill(g,S,S,'#ff5fa8',8);
    for(let i=0;i<60;i++){ const gr=g.createRadialGradient(0,0,0,0,0,40); g.save(); g.translate(r(0,S),r(0,S)); gr.addColorStop(0,'rgba(255,190,220,0.35)'); gr.addColorStop(1,'rgba(255,190,220,0)'); g.fillStyle=gr; g.fillRect(-40,-40,80,80); g.restore(); }
    for(let i=0;i<240;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(r(0,TAU)); g.fillStyle=i%9===0?'#5a2a1a':'#1b1215'; const l=r(12,18); g.beginPath(); g.moveTo(-l/2,-2.6); g.lineTo(l/2,-2.6); g.arc(l/2,0,2.6,-Math.PI/2,Math.PI/2); g.lineTo(-l/2,2.6); g.arc(-l/2,0,2.6,Math.PI/2,Math.PI*1.5); g.fill(); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(-l/2+2,-1.8,l-4,1); g.restore(); }
  },
  missile(g,S,r){ // gunmetal, worn, broken warning-yellow stripes + circuit lines
    noiseFill(g,S,S,'#2c2f33',14);
    for(let i=0;i<50;i++){ g.fillStyle=`rgba(${r(0,1)<0.5?'10,10,12':'70,74,80'},${r(0.1,0.3)})`; g.fillRect(r(0,S),r(0,S),r(20,90),r(4,20)); }
    g.strokeStyle='#e8b400'; g.lineCap='square';
    for(let i=0;i<7;i++){ g.lineWidth=r(3,7); g.beginPath(); let x=r(0,S),y=r(0,S); g.moveTo(x,y); for(let k=0;k<5;k++){ if(r(0,1)<0.5) x+=r(-120,120); else y+=r(-80,80); g.lineTo(x,y); if(r(0,1)<0.3){ g.stroke(); g.beginPath(); x+=r(10,30); g.moveTo(x,y);} } g.stroke(); }
    g.fillStyle='#e8b400'; for(let i=0;i<5;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(-0.5); g.fillRect(-40,-7,80,14); g.restore(); }
  },
  silkblack(g,S,r){ noiseFill(g,S,S,'#0c0c0e',5); for(let i=0;i<40;i++){ g.fillStyle='rgba(255,255,255,0.025)'; g.fillRect(0,r(0,S),S,r(2,8)); } },
  trout(g,S,r){ // rainbow trout: olive speckled back, pink lateral band, silver-white belly (canvas top = top of car)
    const gr=g.createLinearGradient(0,0,0,S); gr.addColorStop(0,'#4e5a2c'); gr.addColorStop(0.35,'#7d8a48'); gr.addColorStop(0.47,'#c9a98a'); gr.addColorStop(0.53,'#e0708a'); gr.addColorStop(0.63,'#e58aa0'); gr.addColorStop(0.72,'#d9d4c6'); gr.addColorStop(1,'#f4f2ea'); g.fillStyle=gr; g.fillRect(0,0,S,S);
    for(let i=0;i<260;i++){ const y=r(0,S*0.66); g.fillStyle=`rgba(20,22,12,${r(0.55,0.9)})`; g.beginPath(); g.ellipse(r(0,S),y,r(2,5),r(2,4),r(0,3),0,TAU); g.fill(); }
    for(let i=0;i<50;i++){ g.fillStyle='rgba(255,255,255,0.12)'; g.fillRect(r(0,S),r(S*0.5,S*0.62),r(10,30),1.5); }
  },
  collage(g,S,r){ // torn paper conspiracy collage over tobacco brown
    noiseFill(g,S,S,'#3a2418',16);
    const papers=['#d9c8a0','#c9b48a','#e6d8b8','#8a2a22','#b9a27a','#6d5a44'];
    for(let i=0;i<55;i++){ g.save(); g.translate(r(0,S),r(0,S)); g.rotate(r(-0.5,0.5)); const w=r(30,90),h=r(24,70); g.fillStyle=papers[Math.floor(r(0,papers.length))]; g.globalAlpha=r(0.55,0.9);
      g.beginPath(); g.moveTo(-w/2,-h/2); for(let k=0;k<6;k++) g.lineTo(-w/2+w*k/5,-h/2+r(-3,3)); g.lineTo(w/2,h/2); for(let k=0;k<6;k++) g.lineTo(w/2-w*k/5,h/2+r(-3,3)); g.fill();
      g.globalAlpha=0.6; g.fillStyle='#2a1a12'; for(let l=0;l<5;l++) g.fillRect(-w/2+5,-h/2+6+l*8,r(w*0.3,w*0.85),2);
      if(r(0,1)<0.3){ g.strokeStyle='#2a1a12'; g.lineWidth=2; g.beginPath(); g.moveTo(0,-12); g.lineTo(11,8); g.lineTo(-11,8); g.closePath(); g.stroke(); g.beginPath(); g.ellipse(0,1,5,3,0,0,TAU); g.stroke(); }
      g.restore(); }
    g.globalAlpha=1; const pins=[]; for(let i=0;i<16;i++) pins.push([r(0,S),r(0,S)]);
    g.strokeStyle='rgba(200,20,30,0.85)'; g.lineWidth=1.6; for(let i=0;i<22;i++){ const a=pins[Math.floor(r(0,16))],b=pins[Math.floor(r(0,16))]; g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); }
    pins.forEach(p=>{ g.fillStyle='#d11'; g.beginPath(); g.arc(p[0],p[1],3,0,TAU); g.fill(); });
    for(let i=0;i<30;i++){ g.fillStyle=`rgba(20,12,8,${r(0.1,0.35)})`; g.beginPath(); g.arc(r(0,S),r(0,S),r(10,40),0,TAU); g.fill(); }
  },
};
function scaleTex(){ return canvasTex(256,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,w,0); gr.addColorStop(0,'#5e8a6a'); gr.addColorStop(0.5,'#c86a78'); gr.addColorStop(1,'#6b8f73'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  const sz=22; for(let y=-1;y<h/sz*2+1;y++) for(let x=-1;x<w/sz+1;x++){ const cx=x*sz+(y%2?sz/2:0), cy=y*sz/2; const hue=(x*37+y*11)%3; g.fillStyle=['rgba(255,150,170,0.35)','rgba(150,230,170,0.3)','rgba(220,200,255,0.3)'][hue]; g.beginPath(); g.arc(cx,cy,sz/2,0,Math.PI); g.fill(); g.strokeStyle='rgba(30,20,20,0.5)'; g.lineWidth=1.6; g.beginPath(); g.arc(cx,cy,sz/2,0.1*Math.PI,0.9*Math.PI); g.stroke(); } },{repeat:true}); }
function styleCar(v,C){
  const {B,M,chassis,body,bodyMat,roofY,frontZ,rearZ,heads,tails,rimMat,spokeMat,addDecal,box}=C;
  const out={list:[]}; const ray=new THREE.Raycaster(); body.updateMatrixWorld(true);
  const top=(x,z)=>{ ray.set(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0)); const h=ray.intersectObject(body)[0]; return h?h.point.y:B.ride+0.6; };
  const side=(sd,y,z)=>{ ray.set(new THREE.Vector3(sd*6,y,z),new THREE.Vector3(-sd,0,0)); const h=ray.intersectObject(body)[0]; return h?h.point.x:sd*B.W/2; };
  const mat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.5},o));
  const mesh=(g,m,x,y,z,par=chassis)=>{ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.castShadow=true; par.add(o); return o; };
  const topDecal=(tex,w,h,x,z,rot=0)=>{ const y=top(x,z)+0.012; const d=addDecal(tex,w,h,new THREE.Vector3(x,y,z),rot,-Math.PI/2); return d; };
  const sideDecal=(tex,w,h,sd,y,z)=>{ const x=side(sd,y,z)+sd*0.012; return addDecal(tex,w,h,new THREE.Vector3(x,y,z),sd*Math.PI/2); };
  const roundel=(n,bg='#f5f2ea',fg='#111')=>decalTex((g)=>{ g.fillStyle=bg; g.beginPath(); g.arc(64,64,60,0,TAU); g.fill(); g.fillStyle=fg; g.font='bold 74px "Racing Sans One", Impact, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(n),64,70); });
  spokeMat.color.setHex(0x0e0e10);

  // ---------------- MISSILE COMMANDER ----------------
  if(v.id==='missile'){
    bodyMat.roughness=0.55; bodyMat.clearcoat=0.2; bodyMat.metalness=0.4;
    const yel=mat(0xe8b400,{roughness:0.4}), blk=mat(0x0d0d0e,{roughness:0.6,metalness:0.4}), amb=new THREE.MeshBasicMaterial({color:0xffb020});
    // amber roof marker lights
    for(let i=-2;i<=2;i++) box(0.18,0.08,0.12,amb,i*0.26,roofY+0.05,C.roof.position.z+0.55);
    // heavy grille with a rack of missiles
    const gz=frontZ+0.04; box(2.05,0.62,0.1,blk,0,B.ride+0.92,gz); box(1.95,0.06,0.14,yel,0,B.ride+1.25,gz+0.02);
    for(let i=-2;i<=2;i++){ const m=new THREE.Group(); m.position.set(i*0.34,B.ride+0.72,gz+0.08); chassis.add(m);
      mesh(new THREE.CylinderGeometry(0.06,0.06,0.42,10),mat(0x9a9ea3,{metalness:0.8,roughness:0.3}),0,0,0,m); mesh(new THREE.ConeGeometry(0.06,0.16,10),mat(0xe8b400,{metalness:0.6}),0,0.29,0,m);
      [-1,1].forEach(sd=>mesh(new THREE.BoxGeometry(0.1,0.1,0.015),blk,sd*0.06,-0.17,0,m)); }
    // headlights: bright LED bars with amber DRL
    heads.forEach(h=>{ h.scale.set(0.9,1.8,1); h.position.y=B.ride+1.02; h.position.x=Math.sign(h.position.x)*0.92; h.position.z=gz+0.02; });
    [-1,1].forEach(sd=>box(0.36,0.04,0.04,amb,sd*0.92,B.ride+1.14,gz+0.04));
    // steel bumper + fog lights + tow hooks
    box(2.3,0.3,0.34,blk,0,B.ride+0.38,frontZ+0.16); [-0.7,0.7].forEach(x=>{ box(0.16,0.1,0.04,amb,x,B.ride+0.4,frontZ+0.34); const hk=mesh(new THREE.TorusGeometry(0.06,0.02,6,12),mat(0xe8b400),x*0.55,B.ride+0.22,frontZ+0.36); });
    // vertical exhaust stacks behind the cab (with warning bands)
    [-0.72,0.72].forEach(x=>{ const z=-0.72; mesh(new THREE.CylinderGeometry(0.09,0.09,1.5,12),blk,x,roofY+0.05,z); box(0.19,0.06,0.19,yel,x,roofY-0.25,z);
      const tip=mesh(new THREE.CylinderGeometry(0.1,0.09,0.25,12,1,true),blk,x,roofY+0.9,z-0.02); tip.rotation.x=-0.5; });
    // rocket fins along both bed rails
    const fs=new THREE.Shape(); fs.moveTo(0,0); fs.lineTo(0.5,0); fs.lineTo(0.1,0.42); fs.lineTo(-0.05,0.42); fs.closePath(); const fgm=new THREE.ExtrudeGeometry(fs,{depth:0.05,bevelEnabled:false}); fgm.rotateY(Math.PI/2);
    [-1,1].forEach(sd=>{ for(let k=0;k<3;k++){ const f=new THREE.Mesh(fgm,blk); f.position.set(sd*(B.W/2-0.12),B.ride+1.34,-1.0-k*0.55); f.castShadow=true; chassis.add(f); const edge=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.3),yel); edge.position.set(sd*(B.W/2-0.12),B.ride+1.36,-1.15-k*0.55); chassis.add(edge); } });
    // missile graphic + nameplate + star roundel
    const ms=decalTex((g)=>{ g.strokeStyle='#e8b400'; g.lineWidth=5; g.fillStyle='rgba(20,20,22,0.9)'; g.beginPath(); g.moveTo(20,64); g.lineTo(60,40); g.lineTo(380,40); g.lineTo(430,20); g.lineTo(430,108); g.lineTo(380,88); g.lineTo(60,88); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#e8b400'; g.fillRect(90,52,6,24); g.fillRect(110,52,6,24); },460,128);
    const nm=decalTex((g)=>{ g.fillStyle='#e8b400'; g.font='italic bold 44px "Racing Sans One",Impact'; g.textAlign='center'; g.fillText('MISSILE COMMANDER',256,48); },512,64);
    const star=decalTex((g)=>{ g.fillStyle='#1a1a1a'; g.beginPath(); g.arc(64,64,58,0,TAU); g.fill(); g.strokeStyle='#e8b400'; g.lineWidth=7; g.stroke(); g.fillStyle='#c9c9c9'; g.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr2=k%2?18:44; g.lineTo(64+Math.cos(a)*rr2,64+Math.sin(a)*rr2);} g.fill(); });
    [-1,1].forEach(sd=>{ sideDecal(ms,2.0,0.55,sd,B.ride+0.95,-1.5); sideDecal(nm,1.5,0.19,sd,B.ride+0.55,0.2); sideDecal(star,0.46,0.46,sd,B.ride+1.05,0.55);
      // mud flaps
      box(0.05,0.5,0.5,blk,sd*(B.W/2-0.25),B.ride+0.15,B.aR-0.8); });
    rimMat.color.setHex(0x1c1c1c); spokeMat.color.setHex(0xe8b400);
  }


  // ---------------- DUCK PLASMA: a yellow rubber duck on a mini hatchback chassis ----------------
  if(v.id==='duck'){
    body.visible=false; C.roof.visible=false; chassis.children.forEach(o=>{ if(o.material===M.glass) o.visible=false; });
    heads.forEach(h=>h.visible=false);
    const rub=new THREE.MeshPhysicalMaterial({color:0xffcf1f,roughness:0.32,clearcoat:0.7,clearcoatRoughness:0.2,envMap:C.env||null});
    const beakM=new THREE.MeshPhysicalMaterial({color:0xff7a12,roughness:0.3,clearcoat:0.6});
    const blk=new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:0.15,metalness:0.2}), wht=new THREE.MeshBasicMaterial({color:0xffffff});
    const ride=B.ride;
    // mini chassis: black rubber skirt + bumpers + round headlights (the "hatchback" part)
    const skirt=mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshPhysicalMaterial({color:0x1d4fa8,roughness:0.3,clearcoat:1}),0,ride+0.3,0); skirt.geometry=roundedBox(B.W-0.15,0.36,B.L-0.25,0.16);
    [-1,1].forEach(sd=>{ const hl=new THREE.Group(); hl.position.set(sd*0.6,ride+0.55,B.L/2-0.05); chassis.add(hl);
      mesh(new THREE.TorusGeometry(0.14,0.035,10,24),M.chrome,0,0,0,hl); mesh(new THREE.CircleGeometry(0.13,20),M.head,0,0,0.005,hl); });
    box(1.0,0.08,0.1,M.chrome,0,ride+0.36,B.L/2-0.05);
    // duck body: plump teardrop
    const bodyG=new THREE.SphereGeometry(1,40,28); const bp=bodyG.attributes.position;
    for(let i=0;i<bp.count;i++){ let x=bp.getX(i),y=bp.getY(i),z=bp.getZ(i); const back=Math.max(0,-z); y+=back*back*0.55*Math.max(0,y+0.2); if(y<0) y*=0.7; bp.setXYZ(i,x,y,z); }
    bodyG.computeVertexNormals();
    const db=mesh(bodyG,rub,0,ride+1.0,-0.15); db.scale.set(0.98,0.62,1.72);
    // wings
    [-1,1].forEach(sd=>{ const w=mesh(new THREE.SphereGeometry(1,24,16),rub,sd*0.86,ride+1.05,-0.35); w.scale.set(0.16,0.34,0.72); w.rotation.x=-0.25; });
    // head + beak + eyes
    const head=mesh(new THREE.SphereGeometry(0.62,36,26),rub,0,ride+1.95,0.85);
    const bu=mesh(new THREE.SphereGeometry(1,28,18),beakM,0,ride+1.82,1.45); bu.scale.set(0.34,0.13,0.4);
    const bl=mesh(new THREE.SphereGeometry(1,24,14),beakM,0,ride+1.71,1.38); bl.scale.set(0.27,0.08,0.3);
    [-1,1].forEach(sd=>{ const e=mesh(new THREE.SphereGeometry(0.1,18,14),blk,sd*0.3,ride+2.1,1.33); e.scale.set(0.8,1.15,0.6); mesh(new THREE.SphereGeometry(0.03,8,6),wht,sd*0.3+sd*0.02,ride+2.15,1.39); });
    // tail tuft
    const tail=mesh(new THREE.ConeGeometry(0.3,0.55,24),rub,0,ride+1.55,-1.72); tail.rotation.x=-1.0;
    rimMat.color.setHex(0xf2f2f2); spokeMat.color.setHex(0xffcf1f);
    // bob / squash while driving
    const bob=[db,head,bu,bl]; const base=bob.map(o=>o.position.y);
    out.list.push((dt,t,car)=>{ const sp=car?Math.min(1,car.speed/40):0.2; const off=Math.sin(t*(4+sp*6))*0.025*(0.3+sp); bob.forEach((o,k)=>o.position.y=base[k]+off*(k?1.4:1)); head.rotation.z=car?clamp(car.latA*0.004,-0.15,0.15):Math.sin(t)*0.05; });
  }

  // ---------------- TROUT PROTOCOL: a rainbow trout hypercar ----------------
  if(v.id==='trout'){
    // project the livery from the side so the back is olive and the belly silver
    const g0=body.geometry, pp=g0.attributes.position, uv=g0.attributes.uv; let ymax=0; for(let i=0;i<pp.count;i++) ymax=Math.max(ymax,pp.getY(i));
    for(let i=0;i<pp.count;i++){ const nz=Math.abs(g0.attributes.normal.getY(i)); let vv=pp.getY(i)/ymax; if(nz>0.7 && pp.getY(i)>ymax*0.55) vv=1; uv.setXY(i,pp.getZ(i)*0.22,clamp(vv,0.02,0.98)); }
    uv.needsUpdate=true; bodyMat.map.repeat.set(1,1); bodyMat.map.offset.set(0,0); bodyMat.roughness=0.3; bodyMat.metalness=0.15;
    const finM=new THREE.MeshPhysicalMaterial({color:0x7d8a48,roughness:0.45,clearcoat:0.5,side:THREE.DoubleSide,transparent:true,opacity:0.95});
    const finShape=(pts)=>{ const s2=new THREE.Shape(); pts.forEach((p,i)=>i?s2.lineTo(p[0],p[1]):s2.moveTo(p[0],p[1])); return s2; };
    const finMesh=(shape,thick)=>{ const g=new THREE.ExtrudeGeometry(shape,{depth:thick,bevelEnabled:true,bevelThickness:0.02,bevelSize:0.02,bevelSegments:2,curveSegments:12}); g.translate(0,0,-thick/2); g.rotateY(-Math.PI/2); return g; };
    // forked tail fin at the rear
    const ts=new THREE.Shape(); ts.moveTo(0,0); ts.quadraticCurveTo(-0.3,0.15,-0.75,0.75); ts.quadraticCurveTo(-0.55,0.3,-0.6,0.05); ts.quadraticCurveTo(-0.55,-0.2,-0.75,-0.5); ts.quadraticCurveTo(-0.3,-0.1,0,-0.12); ts.closePath();
    const tf=new THREE.Mesh(finMesh(ts,0.06),finM); const tz=rearZ+0.35; tf.position.set(0,top(0,tz)+0.3,tz); tf.castShadow=true; chassis.add(tf);
    // dorsal fin on the roof
    const ds=new THREE.Shape(); ds.moveTo(0.3,0); ds.quadraticCurveTo(0.1,0.45,-0.55,0.42); ds.quadraticCurveTo(-0.7,0.2,-0.9,0); ds.closePath();
    const df=new THREE.Mesh(finMesh(ds,0.04),finM); df.position.set(0,roofY-0.02,C.roof.position.z-0.15); df.castShadow=true; chassis.add(df);
    // adipose fin + pectoral fins by the front wheels
    const ad=new THREE.Mesh(finMesh(finShape([[0,0],[-0.15,0.18],[-0.35,0]]),0.03),finM); ad.position.set(0,top(0,-1.2),-1.2); chassis.add(ad);
    [-1,1].forEach(sd=>{ const pf=new THREE.Mesh(new THREE.ExtrudeGeometry(finShape([[0,0],[-0.55,0.06],[-0.4,-0.14]]),{depth:0.03,bevelEnabled:false}),finM); pf.rotation.set(-Math.PI/2+0.3*sd,0,Math.PI/2*sd);
      pf.rotation.order='YXZ'; pf.rotation.set(0.35,sd>0?Math.PI/2:-Math.PI/2,0); pf.position.set(side(sd,B.ride+0.3,B.aF-0.7)+sd*0.02,B.ride+0.28,B.aF-0.7); chassis.add(pf); });
    // fish eyes on the front flanks + gill arcs + mouth
    const eyeTex=decalTex((g)=>{ g.fillStyle='#e8c35a'; g.beginPath(); g.arc(64,64,58,0,TAU); g.fill(); g.fillStyle='#0a0a0a'; g.beginPath(); g.arc(64,64,34,0,TAU); g.fill(); g.fillStyle='#fff'; g.beginPath(); g.arc(50,50,9,0,TAU); g.fill(); });
    const gill=decalTex((g)=>{ g.strokeStyle='rgba(120,30,40,0.85)'; g.lineWidth=7; for(let k=0;k<2;k++){ g.beginPath(); g.arc(-60+k*22,64,110,-0.55,0.55); g.stroke(); } });
    [-1,1].forEach(sd=>{ const d=sideDecal(eyeTex,0.3,0.3,sd,B.ride+0.4,frontZ-0.55); const gd=sideDecal(gill,0.5,0.55,sd,B.ride+0.38,frontZ-1.05); if(sd<0) gd.scale.x=-1; });
    box(0.9,0.05,0.05,mat(0x3a1a20),0,B.ride+0.22,frontZ+0.02);
    rimMat.color.setHex(0x3a4020); spokeMat.color.setHex(0x9aa05a);
    // tail swish
    out.list.push((dt,t,car)=>{ const lat=car?car.latA:0; tf.rotation.y=Math.sin(t*(car?6:2.5))*0.12+clamp(lat*0.004,-0.25,0.25); });
  }

  // ---------------- CONCORDANCE: war hero's silk-black limousine ----------------
  if(v.id==='concord'){
    bodyMat.roughness=0.42; bodyMat.metalness=0.35; bodyMat.clearcoat=0.35; bodyMat.clearcoatRoughness=0.35; bodyMat.map.repeat.set(0.3,0.3);
    const gold=M.gold;
    // tall chrome waterfall grille + bumper blades
    const gz=frontZ+0.02; box(1.1,0.42,0.06,M.chrome,0,B.ride+0.52,gz); for(let k=-5;k<=5;k++) box(0.03,0.38,0.08,mat(0x1a1a1a),k*0.095,B.ride+0.52,gz+0.01);
    box(1.9,0.1,0.12,M.chrome,0,B.ride+0.22,frontZ+0.04); box(1.9,0.1,0.12,M.chrome,0,B.ride+0.22,rearZ-0.04);
    heads.forEach(h=>{ h.scale.set(0.7,1.2,1); h.position.x=Math.sign(h.position.x)*0.78; });
    // gold pinstripe along both flanks
    [-1,1].forEach(sd=>{ const x=side(sd,B.ride+0.72,0); box(0.02,0.03,B.L-0.7,gold,x+sd*0.006,B.ride+0.72,0); box(0.02,0.07,B.L-1.2,M.chrome,side(sd,B.ride+0.3,0)+sd*0.006,B.ride+0.3,0); });
    // AK-47 silhouette texture (used for crest + trunk badge)
    const drawAK=(g,sc,col)=>{ g.save(); g.scale(sc,sc); g.fillStyle=col; g.beginPath();
      g.moveTo(0,20); g.lineTo(38,16); g.lineTo(46,12); g.lineTo(120,12); g.lineTo(120,8); g.lineTo(150,8); g.lineTo(150,14); g.lineTo(122,16); g.lineTo(118,22); g.lineTo(84,22); // barrel/handguard/receiver top
      g.lineTo(80,40); g.quadraticCurveTo(76,52,70,54); g.lineTo(64,50); g.quadraticCurveTo(70,40,70,24); // curved magazine
      g.lineTo(58,24); g.lineTo(52,36); g.lineTo(44,36); g.lineTo(46,24); g.lineTo(36,24); g.lineTo(6,38); g.lineTo(0,30); g.closePath(); g.fill(); g.restore(); };
    const crest=decalTex((g)=>{ g.translate(128,128); [-1,1].forEach(sd=>{ g.save(); g.rotate(sd*0.62); g.translate(-80,-18); drawAK(g,1.05,'#d4a33a'); g.restore(); });
      g.fillStyle='#d4a33a'; g.beginPath(); for(let k=0;k<10;k++){ const a=k/10*TAU-Math.PI/2, rr2=k%2?11:26; g.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2-46);} g.fill();
      g.strokeStyle='#d4a33a'; g.lineWidth=4; g.beginPath(); g.arc(0,8,86,0.35,Math.PI-0.35); g.stroke(); },256,256);
    const ribbon=decalTex((g)=>{ const cs=['#7a1020','#f2f2f2','#1f3f8a','#d4a33a','#2e6b3a','#b3202a']; for(let k=0;k<6;k++){ g.fillStyle=cs[k]; g.fillRect((k%3)*42+2,Math.floor(k/3)*30+4,40,28);} },128,64);
    [-1,1].forEach(sd=>{ sideDecal(crest,0.9,0.9,sd,B.ride+0.52,-0.4); sideDecal(ribbon,0.3,0.15,sd,B.ride+0.62,B.aF-0.55); });
    const tb=decalTex((g)=>{ g.fillStyle='#d4a33a'; g.font='bold 34px "Chakra Petch",sans-serif'; g.textAlign='center'; g.fillText('C O N C O R D A N C E',256,44); },512,64);
    addDecal(tb,1.2,0.15,new THREE.Vector3(0,B.ride+0.82,rearZ-0.02),Math.PI);
    // gold AK-47 hood ornament
    const ornTex=decalTex((g)=>{ g.translate(8,40); drawAK(g,0.75,'#e0b44a'); },128,128);
    const orn=new THREE.Group(); const oz=frontZ-0.3; orn.position.set(0,top(0,oz)+0.02,oz); chassis.add(orn);
    mesh(new THREE.CylinderGeometry(0.05,0.07,0.06,12),gold,0,0.03,0,orn);
    const op=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.42),new THREE.MeshStandardMaterial({map:ornTex,transparent:true,metalness:1,roughness:0.25,color:0xffffff,side:THREE.DoubleSide,alphaTest:0.3,envMap:C.env||null})); op.rotation.y=Math.PI/2; op.position.set(0,0.13,0.05); orn.add(op);
    // fender flag staffs (diplomatic style) with waving flags
    const flagTex=decalTex((g)=>{ for(let k=0;k<13;k++){ g.fillStyle=k%2?'#ffffff':'#b3202a'; g.fillRect(0,k*64/13,128,64/13+0.5);} g.fillStyle='#1f3f8a'; g.fillRect(0,0,54,35); g.fillStyle='#fff'; for(let a=0;a<4;a++) for(let b=0;b<3;b++){ g.fillRect(6+a*12,5+b*10,3,3);} },128,64);
    const flags=[];
    [-1,1].forEach(sd=>{ const fx=sd*0.72, fz=frontZ-0.45, fy=top(fx,fz); mesh(new THREE.CylinderGeometry(0.012,0.012,0.55,6),M.chrome,fx,fy+0.27,fz); mesh(new THREE.SphereGeometry(0.025,8,6),gold,fx,fy+0.56,fz);
      const fg=new THREE.PlaneGeometry(0.34,0.2,8,1); fg.translate(-0.17,0,0); const f=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide,roughness:0.8}));
      f.rotation.y=Math.PI/2; f.position.set(fx,fy+0.44,fz); chassis.add(f); flags.push(f); });
    rimMat.color.setHex(0x0e0e0e); spokeMat.color.setHex(0xd4a33a);
    out.list.push((dt,t,car)=>{ const sp=car?Math.min(1,car.speed/30):0.35; flags.forEach((f,k)=>{ const p=f.geometry.attributes.position; for(let i=0;i<p.count;i++){ const x=p.getX(i); p.setZ(i,Math.sin(x*18+t*(6+sp*14)+k)*0.03*(-x/0.34)*(0.4+sp)); } p.needsUpdate=true; }); });
  }
  return out;
}
function roundedBox(w,h,d,r){ const s=new THREE.Shape(); const x=-d/2,y=-h/2; s.moveTo(x+r,y); s.lineTo(x+d-r,y); s.quadraticCurveTo(x+d,y,x+d,y+r); s.lineTo(x+d,y+h-r); s.quadraticCurveTo(x+d,y+h,x+d-r,y+h); s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:w-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*0.9,bevelSegments:5,curveSegments:10}); g.translate(0,0,-(w-2*r)/2); g.rotateY(-Math.PI/2); g.computeVertexNormals(); return g; }


// ===== GLB CAR MODELS (Meshy exports supplied by the player) =====
// GLB_DATA (base64 per vehicle id) is injected by the build.
const CAR_GLTF={}, GLB_PROC={};
const GLB_ROT={brcc:Math.PI/2, fdc:Math.PI/2, hellcat:Math.PI/2};
const GLB_LEN={hellcat:4.9,brcc:4.4,fdc:5.3,duck:3.9,gt44:4.4,donut:4.5,missile:5.8,bpd:4.8,concord:5.8,trout:5.0,leopard:4.5};
const GLB_TEXTURES={}; let GLB_ERROR='';
function loadCarGLBs(done,progress){
  const data=(typeof GLB_DATA!=='undefined')?GLB_DATA:{}; const ids=Object.keys(data);
  if(!ids.length){ done(); return; }
  if(!THREE.GLTFLoader){ GLB_ERROR='model loader missing'; done(); return; }
  const texSrc=(typeof GLB_TEX!=='undefined')?GLB_TEX:{};
  // 1) decode textures through plain <img> data URIs (works under strict hosting rules)
  const jobs=[]; ids.forEach(id=>{ GLB_TEXTURES[id]={}; Object.entries(texSrc[id]||{}).forEach(([slot,uri])=>{ jobs.push(new Promise(res=>{ const im=new Image(); im.onload=()=>{ const t=new THREE.Texture(im); t.flipY=false; if(slot==='base') t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.needsUpdate=true; GLB_TEXTURES[id][slot]=t; res(); }; im.onerror=()=>{ GLB_ERROR='texture '+id+'/'+slot; res(); }; im.src=uri; })); }); });
  Promise.all(jobs).then(()=>{
    const L=new THREE.GLTFLoader(); let left=ids.length, k=0;
    const next=()=>{ if(k>=ids.length) return; const id=ids[k++];
      const parse=buf=>L.parse(buf,'',g=>{ CAR_GLTF[id]=g.scene; fin(); },e=>{ GLB_ERROR=id+': '+(e&&e.message||e); console.warn('GLB failed',id,e); fin(); });
      const src=data[id];
      if(/\.glb(\?|$)/i.test(src)){ fetch(src).then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status+' '+src); return r.arrayBuffer(); }).then(parse).catch(e=>{ GLB_ERROR=id+': '+e.message; fin(); }); return; }
      try{ const s=atob(src); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); parse(u.buffer); }
      catch(e){ GLB_ERROR=id+': '+e.message; console.warn('GLB decode failed',id,e); fin(); } };
    const fin=()=>{ left--; if(progress) progress(ids.length-left,ids.length); if(left<=0) done(); else setTimeout(next,0); };
    next();
  });
}
function processGLB(id){
  if(GLB_PROC[id]) return GLB_PROC[id];
  const sc=CAR_GLTF[id]; sc.updateMatrixWorld(true);
  const meshes=[]; sc.traverse(o=>{ if(o.isMesh) meshes.push(o); });
  meshes.forEach(o=>{ o.geometry=o.geometry.clone(); o.geometry.applyMatrix4(o.matrixWorld); if(GLB_ROT[id]) o.geometry.rotateY(GLB_ROT[id]); if(!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); });
  const box=new THREE.Box3(); meshes.forEach(o=>{ o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox); });
  const size=box.getSize(new THREE.Vector3()), s=(GLB_LEN[id]||4.5)/size.z;
  const cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2, my=box.min.y;
  const body=[], wheels=[];
  meshes.forEach(o=>{ const g=o.geometry; g.translate(-cx,-my,-cz); g.scale(s,s,s); g.computeBoundingBox();
    const mt=o.material; if(mt){ const T=GLB_TEXTURES[id]||{}; mt.flatShading=false; if(T.base){ mt.map=T.base; mt.color.setHex(0xffffff); } if(T.normal) mt.normalMap=T.normal; if(T.mr){ mt.roughnessMap=T.mr; mt.metalnessMap=T.mr; } mt.needsUpdate=true; }
    if(/wheel/i.test(o.name)){ const c=g.boundingBox.getCenter(new THREE.Vector3()); const ws=g.boundingBox.getSize(new THREE.Vector3()); g.translate(-c.x,-c.y,-c.z);
      wheels.push({name:o.name,c,r:ws.y/2,w:ws.x,geo:g,mat:mt,front:/F[LR]/.test(o.name)}); }
    else body.push({geo:g,mat:mt}); });
  const bb=new THREE.Box3(); body.forEach(b=>bb.union(b.geo.boundingBox)); const bs=bb.getSize(new THREE.Vector3());
  const fr=wheels.filter(w=>w.front), rr2=wheels.filter(w=>!w.front);
  const avg=(a,f)=>a.length?a.reduce((t,w)=>t+f(w),0)/a.length:0;
  const P={body,wheels,L:bs.z,W:bs.x,H:bs.y,wr:avg(wheels,w=>w.c.y)||0.36,ww:avg(wheels,w=>w.w)||0.3,aF:avg(fr,w=>w.c.z),aR:avg(rr2,w=>w.c.z),zMin:bb.min.z,zMax:bb.max.z};
  GLB_PROC[id]=P; return P;
}
function applyGlbModel(m,v,env){
  const P=processGLB(v.id);
  // hide the procedural car, keep the effect rig (boost flames, shield bubble)
  const keep=new Set([m.shield,...m.flames]);
  m.root.traverse(o=>{ if(o!==m.root && o!==m.chassis && (o.isMesh||o.isSprite||o.isLine) && !keep.has(o)) o.visible=false; });
  const mats=new Map(); const matFor=mt=>{ if(!mats.has(mt)){ const c=mt.clone(); c.envMap=env||null; c.envMapIntensity=0.9; mats.set(mt,c); } return mats.get(mt); };
  const bodyMeshes=[];
  P.body.forEach(b=>{ const o=new THREE.Mesh(b.geo,matFor(b.mat)); o.castShadow=true; o.receiveShadow=false; m.chassis.add(o); bodyMeshes.push(o); });
  const wheels=[], steer=[];
  P.wheels.forEach(w=>{ const piv=new THREE.Group(); piv.position.copy(w.c); m.root.add(piv); const spin=new THREE.Group(); piv.add(spin);
    const o=new THREE.Mesh(w.geo,matFor(w.mat)); o.castShadow=true; spin.add(o); wheels.push(spin); if(w.front) steer.push(piv); });
  // tail-light glow (brighter when braking)
  const tailMat=new THREE.SpriteMaterial({map:glbGlowTex(),color:0x8c0814,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
  const ray=new THREE.Raycaster();
  [-1,1].forEach(sd=>{ const x=sd*P.W*0.34, y=Math.min(P.H*0.45,1.0); ray.set(new THREE.Vector3(x,y,P.zMin-3),new THREE.Vector3(0,0,1)); const h=ray.intersectObjects(bodyMeshes)[0];
    const sp=new THREE.Sprite(tailMat); sp.scale.set(0.45,0.3,1); sp.position.set(x,y,(h?h.point.z:P.zMin)-0.05); m.chassis.add(sp); });
  m.flames.forEach((f,k)=>{ f.position.set((k?1:-1)*0.35,0.4,P.zMin-0.1); });
  m.shield.scale.set(P.W*0.75,Math.max(1.1,P.H*0.7),P.L*0.62);
  m.wheels=wheels; m.steerPivots=steer; m.tailMat=tailMat; m.lightbar=null; m.anims=[];
  m.dims=Object.assign({},m.dims,{H:P.H,L:P.L,W:P.W,wr:P.wr,ww:P.ww,aF:P.aF,aR:P.aR}); m.glb=true;
  return m;
}
let _glbGlow=null; function glbGlowTex(){ if(!_glbGlow) _glbGlow=canvasTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,0.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }); return _glbGlow; }

// ---------- scenery props (GLB) ----------
const PROP_INFO={
  watch_shop:{h:7, kind:'building', themes:{sweet:2, alondra:3}},
  watch_sign:{h:10, kind:'billboard', face:1, themes:{sweet:1, alondra:1}},
  range_sign:{h:4, kind:'billboard', face:-1, themes:{mesa:2, alondra:1}},
  solocup:{h:30, kind:'manual'},
  church:{h:20, kind:'building', themes:{country:1}},
  donkeys:{h:4.2, kind:'billboard', face:1, themes:{country:1}},
  hijoe:{h:9, kind:'billboard', face:1, themes:{sweet:1, mesa:1, coast:1, neon:1, alondra:1, country:1}},
  palm:{h:12, kind:'manual'}, mrblack:{h:1.85, kind:'manual'}, ak:{len:0.9, kind:'manual'},
  shoe_factory:{h:12, kind:'building', themes:{sweet:1, alondra:1, neon:2}},
  claw_can:{h:6, kind:'billboard', face:1, themes:{sweet:1, alondra:1}, median:{sweet:[22,40,58]}},
  echelon_can:{h:6, kind:'billboard', face:-1, themes:{sweet:1, alondra:1}, median:{sweet:[31,49]}},
};
const PROP_PROC={}; const PROP_DBG={fp:0,cand:0};
function propTemplate(id){
  if(PROP_PROC[id]) return PROP_PROC[id]; if(!CAR_GLTF[id]) return null;
  const sc=CAR_GLTF[id]; sc.updateMatrixWorld(true); const parts=[]; const box=new THREE.Box3();
  sc.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld); if(!g.attributes.normal) g.computeVertexNormals(); g.computeBoundingBox(); box.union(g.boundingBox);
    const mt=o.material.clone(); const T=GLB_TEXTURES[id]||{}; if(T.base){ mt.map=T.base; mt.color.setHex(0xffffff); } if(T.normal) mt.normalMap=T.normal; if(T.mr){ mt.roughnessMap=T.mr; mt.metalnessMap=T.mr; } mt.flatShading=false; if((PROP_INFO[id]||{}).kind==='billboard' && mt.map){ mt.emissiveMap=mt.map; mt.emissive=new THREE.Color(0xffffff); mt.emissiveIntensity=0.35; } mt.needsUpdate=true; parts.push({g,mt}); });
  const info=PROP_INFO[id]||{}; const size=box.getSize(new THREE.Vector3()); const s=info.len?info.len/Math.max(size.x,size.z):(info.h||size.y)/size.y; const cx=(box.min.x+box.max.x)/2, cz=(box.min.z+box.max.z)/2;
  parts.forEach(p=>{ p.g.translate(-cx,-box.min.y,-cz); p.g.scale(s,s,s); });
  const T={parts,w:size.x*s,d:size.z*s,h:size.y*s}; PROP_PROC[id]=T; return T;
}
function makeProp(id){ const T=propTemplate(id); if(!T) return null; const grp=new THREE.Group(); T.parts.forEach(p=>{ const m=new THREE.Mesh(p.g,p.mt); m.castShadow=true; m.receiveShadow=true; grp.add(m); }); return grp; }
// Places GLB props for this track along straight sections, facing the road. Returns blocker circles.
function placeTrackProps(W,def,P,H){
  const blockers=[]; if(typeof CAR_GLTF==='undefined') return blockers;
  // median props (e.g. giant cans on the Compton Heights boulevard), readable side toward oncoming cars
  for(const id in PROP_INFO){ const info=PROP_INFO[id], list=info.median&&info.median[def.id]; if(!list||!CAR_GLTF[id]) continue; const T=propTemplate(id); if(!T) continue;
    list.forEach(i=>{ if(P.median[i]<Math.max(T.w,T.d)/2) return; const o=makeProp(id); const ang=info.face>0?Math.atan2(-P.tx[i],-P.tz[i]):Math.atan2(P.tx[i],P.tz[i]);
      o.position.set(P.x[i],P.y[i]+0.12,P.z[i]); o.rotation.y=ang; W.group.add(o); (W.props=W.props||[]).push({id,x:P.x[i],z:P.z[i],y:P.y[i],ang,i,median:true}); blockers.push({x:P.x[i],z:P.z[i],r:Math.max(T.w,T.d)/2+0.2}); }); }
  for(const id in PROP_INFO){
    const want=(PROP_INFO[id].themes||{})[def.id]; if(!want || !CAR_GLTF[id] || PROP_INFO[id].kind==='manual') continue; const T=propTemplate(id); if(!T) continue;
    const cand=[]; const K=12;
    for(let i=40;i<P.N-40;i+=6){ let c=0; for(let k=-K;k<=K;k++) c=Math.max(c,Math.abs(P.curv[(i+k)%P.N])); if(c<0.006) cand.push(i); }
    PROP_DBG.cand=cand.length;
    // spread picks around the lap
    const picks=[]; const step=Math.max(1,Math.floor(cand.length/(want*2+1)));
    for(let n=0;n<cand.length && picks.length<want;n++){ const i=cand[(Math.floor(n*step*1.7)+step+Object.keys(PROP_INFO).indexOf(id)*Math.max(1,Math.floor(step/2)))%cand.length]; if(picks.some(q=>Math.abs(q.i-i)<60)) continue;
      const info=PROP_INFO[id], bill=info.kind==='billboard';
      for(const sd of (n%2?[1,-1]:[-1,1])){ const e=(sd<0?P.wl[i]:P.wr[i])+(bill?2.5+T.w*0.5:4.5+T.d/2); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd;
        let ang;
        if(bill){ const nx=-P.tx[i]*0.8-sd*P.rx[i]*0.6, nz=-P.tz[i]*0.8-sd*P.rz[i]*0.6; ang=info.face>0?Math.atan2(nx,nz):Math.atan2(-nx,-nz); }
        else ang=Math.atan2(-sd*P.rx[i],-sd*P.rz[i]);
        if(!H.footprintClear(x,z,ang,T.w+1,T.d+1,1.0)){ PROP_DBG.fp++; continue; } if(blockers.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+Math.max(T.w,T.d)/2)) continue;
        picks.push({i,x,z,ang}); break; } }
    picks.forEach(p=>{ const o=makeProp(id); let y=1e9; for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ y=Math.min(y,H.heightAt(p.x+a*T.w/2,p.z+b*T.d/2)); } o.position.set(p.x,y-0.05,p.z); o.rotation.y=p.ang; W.group.add(o); (W.props=W.props||[]).push({id,x:p.x,z:p.z,y,ang:p.ang,i:p.i});
      blockers.push({x:p.x,z:p.z,r:Math.hypot(T.w,T.d)/2+1.5}); });
  }
  return blockers;
}

// ===== WORLD: themes, road, terrain, sky =====
const THEMES={
 city:{ skyTop:0x3f86d8, skyHor:0xf6dcb8, sunCol:0xffe0b0, sunI:2.3, sunDir:[-0.55,0.62,0.55], hemiS:0xc4dcff, hemiG:0x8c6e4c, hemiI:0.85,
   fog:0xeed6b4, fogNear:120, fogFar:900, exposure:1.0, road:'#5c5c61', roadLine:'white', curbA:'#d8262b', curbB:'#f4f4f4', edge:'#9a9a9a', shoulder:'sidewalk', wall:'jersey', wallH:1.0, groundBase:[0.52,0.5,0.44] },
 dusk:{ skyTop:0x2c2f78, skyHor:0xff9a6a, sunCol:0xffa060, sunI:1.9, sunDir:[-0.75,0.24,0.45], hemiS:0xa89ae0, hemiG:0x6e4a40, hemiI:0.85,
   fog:0xd99a86, fogNear:110, fogFar:760, exposure:1.05, road:'#4f4d55', roadLine:'white', curbA:'#ffc23d', curbB:'#2a2a2e', edge:'#8a8a8a', shoulder:'sidewalk', wall:'jersey', wallH:1.0, groundBase:[0.5,0.46,0.42] },
 country:{ skyTop:0x4f7fc4, skyHor:0xffc98a, sunCol:0xffc37a, sunI:2.4, sunDir:[-0.62,0.38,0.62], hemiS:0xb8d0ff, hemiG:0x6b7a3a, hemiI:0.9,
   fog:0xf2cfa0, fogNear:180, fogFar:1300, exposure:1.02, road:'#4e4a47', roadLine:'yellow', curbA:'#c8281e', curbB:'#f3ecd9', edge:'#a0633f', shoulder:'dirt', wall:'wood', wallH:1.0 },
 desert:{ skyTop:0x2f78d6, skyHor:0xf8dcb6, sunCol:0xfff0d4, sunI:2.6, sunDir:[0.3,0.85,-0.4], hemiS:0xbfdcff, hemiG:0xc28a58, hemiI:0.8,
   fog:0xf3d8b6, fogNear:200, fogFar:1400, exposure:0.95, road:'#56504b', roadLine:'yellow', curbA:'#e05a1a', curbB:'#f2eadc', edge:'#c9a27a', shoulder:'sand', wall:'guardrail', wallH:0.85 },
 coast:{ skyTop:0x3a6cc0, skyHor:0xffbe86, sunCol:0xffc27a, sunI:2.5, sunDir:[-0.8,0.32,0.2], hemiS:0xa9c4f2, hemiG:0x7a6044, hemiI:0.9,
   fog:0xf0bf94, fogNear:160, fogFar:1300, exposure:1.02, road:'#4d4d53', roadLine:'yellow', curbA:'#d8262b', curbB:'#f4f4f4', edge:'#8c8c7c', shoulder:'gravel', wall:'guardrail', wallH:0.85 },
 night:{ skyTop:0x05041a, skyHor:0x3d1656, sunCol:0x8f9cff, sunI:0.45, sunDir:[0.4,0.7,0.3], hemiS:0x4a3a8a, hemiG:0x160a26, hemiI:0.75,
   fog:0x1c0f33, fogNear:60, fogFar:620, exposure:1.2, road:'#1c1c24', roadLine:'white', curbA:'#ff2e97', curbB:'#1a1a22', edge:'#2a2a33', shoulder:'wetconcrete', wall:'neon', wallH:1.0, night:true },
};
function roadTexture(th){
  return canvasTex(512,1024,(g,w,h)=>{
    noiseFill(g,w,h,th.road,th.night?10:26);
    for(let i=0;i<2200;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'255,255,255':'0,0,0'},${Math.random()*0.08})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*4,2+Math.random()*4); }
    // tire wear bands
    g.fillStyle='rgba(0,0,0,0.12)'; [0.28,0.72].forEach(u=>g.fillRect(u*w-40,0,80,h));
    // patches
    for(let i=0;i<6;i++){ g.fillStyle=`rgba(0,0,0,${0.05+Math.random()*0.08})`; g.fillRect(Math.random()*w,Math.random()*h,60+Math.random()*120,40+Math.random()*160); }
    g.fillStyle='rgba(240,240,240,0.9)'; g.fillRect(w*0.03,0,10,h); g.fillRect(w*0.97-10,0,10,h);
    if(th.roadLine==='yellow'){ g.fillStyle='#f2c230'; g.fillRect(w/2-16,0,10,h); g.fillRect(w/2+6,0,10,h); }
    else { g.fillStyle='rgba(245,245,245,0.9)'; g.fillRect(w/2-6,0,12,h*0.45); }
    if(th.night){ // wet sheen streaks
      for(let i=0;i<40;i++){ g.fillStyle=`rgba(120,140,200,${Math.random()*0.06})`; g.fillRect(Math.random()*w,0,4+Math.random()*20,h); } }
  },{repeat:true,aniso:8});
}
function stripTex(a,b,n=2){ return canvasTex(64,128,(g,w,h)=>{ for(let i=0;i<n;i++){ g.fillStyle=i%2?b:a; g.fillRect(0,i*h/n,w,h/n);} g.fillStyle='rgba(0,0,0,0.15)'; g.fillRect(w-6,0,6,h); },{repeat:true}); }
function shoulderTexture(kind){
  return canvasTex(256,256,(g,w,h)=>{
    if(kind==='sidewalk'){ noiseFill(g,w,h,'#b9b3a8',18); g.strokeStyle='rgba(60,50,40,0.35)'; g.lineWidth=2; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(0,i*64); g.lineTo(w,i*64); g.stroke(); g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64,h); g.stroke(); }
      for(let i=0;i<30;i++){ g.fillStyle='rgba(40,30,20,0.12)'; g.beginPath(); g.arc(Math.random()*w,Math.random()*h,2+Math.random()*6,0,TAU); g.fill(); } }
    else if(kind==='dirt'){ noiseFill(g,w,h,'#9c4a2a',26); for(let i=0;i<420;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'70,30,15':'190,110,70'},${Math.random()*0.45})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2); } for(let i=0;i<30;i++){ g.fillStyle='rgba(90,110,40,0.35)'; g.fillRect(Math.random()*w,Math.random()*h,2,5); } }
    else if(kind==='sand'){ noiseFill(g,w,h,'#c99a68',30); for(let i=0;i<400;i++){ g.fillStyle=`rgba(90,60,30,${Math.random()*0.4})`; g.fillRect(Math.random()*w,Math.random()*h,2,2);} }
    else if(kind==='gravel'){ noiseFill(g,w,h,'#9a8e70',30); for(let i=0;i<300;i++){ g.fillStyle=`rgba(${Math.random()<0.5?'60,70,30':'170,150,90'},0.5)`; g.fillRect(Math.random()*w,Math.random()*h,3,3);} }
    else { noiseFill(g,w,h,'#2b2b33',14); for(let i=0;i<14;i++){ g.fillStyle='rgba(90,110,170,0.12)'; g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*30,6+Math.random()*14,0,0,TAU); g.fill(); } }
  },{repeat:true});
}
function wallTexture(kind){
  return canvasTex(256,64,(g,w,h)=>{
    if(kind==='jersey'){ noiseFill(g,w,h,'#c9c4ba',20); g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(0,h-10,w,10);
      const cols=['#ff2e97','#27d3ff','#ffd23f','#7cff6b','#b65cff']; for(let i=0;i<5;i++){ g.fillStyle=cols[Math.floor(Math.random()*5)]; g.globalAlpha=0.8; g.beginPath(); g.ellipse(Math.random()*w,20+Math.random()*25,10+Math.random()*25,6+Math.random()*10,Math.random(),0,TAU); g.fill(); } g.globalAlpha=1;
      g.fillStyle='rgba(0,0,0,0.3)'; g.fillRect(w-3,0,3,h); }
    else if(kind==='wood'){ noiseFill(g,w,h,'#8a5a34',22); g.fillStyle='rgba(40,22,10,0.55)'; [14,34,54].forEach(y=>g.fillRect(0,y,w,2)); for(let i=0;i<60;i++){ g.fillStyle='rgba(60,35,15,0.35)'; g.fillRect(Math.random()*w,Math.random()*h,20+Math.random()*40,1); } g.fillStyle='rgba(30,16,6,0.6)'; for(let x=0;x<w;x+=64) g.fillRect(x,0,6,h); }
    else if(kind==='guardrail'){ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#e6e8ea'); gr.addColorStop(0.35,'#9aa0a6'); gr.addColorStop(0.5,'#dfe2e4'); gr.addColorStop(0.7,'#8a9096'); gr.addColorStop(1,'#555'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.fillStyle='rgba(120,70,30,0.2)'; for(let i=0;i<20;i++) g.fillRect(Math.random()*w,Math.random()*h,4,2); }
    else { noiseFill(g,w,h,'#16161e',10); g.fillStyle='rgba(255,255,255,0.05)'; for(let i=0;i<8;i++) g.fillRect(i*32,0,2,h); }
  },{repeat:true});
}
function makeSky(th,radius){
  const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
    uniforms:{top:{value:new THREE.Color(th.skyTop)},hor:{value:new THREE.Color(th.skyHor)},sun:{value:new THREE.Vector3(...th.sunDir).normalize()},sunc:{value:new THREE.Color(th.sunCol)},night:{value:th.night?1:0}},
    vertexShader:'varying vec3 d;void main(){d=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader:`uniform vec3 top,hor,sunc,sun;uniform float night;varying vec3 d;
      float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
      void main(){ float y=max(d.y,0.); vec3 c=mix(hor,top,pow(y,0.55)); if(d.y<0.) c=hor*0.92;
       float s=max(dot(d,sun),0.); c+=sunc*(pow(s,600.)*(1.-night)*4.+pow(s,8.)*0.35*(1.-night*0.7)+pow(s,2.)*0.08);
       if(night>0.5){ vec3 q=floor(d*420.); float st=step(0.9975,h(q))*smoothstep(0.05,0.35,d.y); c+=vec3(st)*(0.6+0.4*h(q+1.)); c+=vec3(0.55,0.15,0.5)*pow(1.-y,6.)*0.35; }
       gl_FragColor=vec4(c,1.);}`});
  const m=new THREE.Mesh(new THREE.SphereGeometry(radius,32,16),mat); m.renderOrder=-10; m.frustumCulled=false; return m;
}
// spatial hash of road samples
function buildRoadHash(P){
  const C=24, map=new Map();
  for(let i=0;i<P.N;i++){ const k=Math.floor(P.x[i]/C)+','+Math.floor(P.z[i]/C); let a=map.get(k); if(!a){a=[];map.set(k,a);} a.push(i); }
  const out={d:0,i:0,edge:0,y:0,gap:0};
  return function(x,z,R=3){
    const cx=Math.floor(x/C),cz=Math.floor(z/C); let bd=1e18,bi=-1;
    for(let a=-R;a<=R;a++)for(let b=-R;b<=R;b++){ const l=map.get((cx+a)+','+(cz+b)); if(!l) continue; for(const i of l){ const dx=x-P.x[i],dz=z-P.z[i],d=dx*dx+dz*dz; if(d<bd){bd=d;bi=i;} } }
    if(bi<0){ out.d=1e9; out.i=-1; return out; }
    out.d=Math.sqrt(bd); out.i=bi; out.edge=Math.max(P.wl[bi],P.wr[bi]); out.y=P.y[bi]; out.gap=P.gap[bi]; return out;
  };
}

// ===== WORLD BUILDER =====
function naturalHeightFn(def,P){
  let cx=0,cz=0; for(let i=0;i<P.N;i++){cx+=P.x[i];cz+=P.z[i];} cx/=P.N; cz/=P.N;
  let R0=0; for(let i=0;i<P.N;i++) R0=Math.max(R0,Math.hypot(P.x[i]-cx,P.z[i]-cz));
  const channels=[]; (def.jumps||[]).forEach(j=>{ if(j.gap>0){ const gl=Math.round(j.gap/P.spacing); const m=(j.top+Math.round(gl/2))%P.N; channels.push({x:P.x[m],z:P.z[m],dx:P.rx[m],dz:P.rz[m],y:P.y[m]}); }});
  const chan=(x,z,h)=>{ for(const c of channels){ const px=x-c.x,pz=z-c.z; const along=px*c.dx+pz*c.dz; const perp=Math.abs(px*c.dz-pz*c.dx); if(Math.abs(along)<420){ const floor=c.y-11; const t=smooth01((perp-7)/7); h=Math.min(h,lerp(floor,h,t)); } } return h; };
  const t=def.theme; let f;
  if(t==='city') f=(x,z)=>{ const d=Math.hypot(x-cx,z-cz); return smooth01((d-R0-160)/380)*(25+110*fbm(x*0.004,z*0.004)); };
  else if(t==='desert'){ const mesas=[[150,420,70,34],[520,300,90,55],[-160,250,80,40],[380,-220,110,48],[-120,-120,60,30],[250,120,45,22],[120,300,40,26],[-300,600,140,70],[700,650,160,80],[600,-500,140,60],[-400,-300,150,55]];
    f=(x,z)=>{ let h=1.6*fbm(x*0.015,z*0.015)+0.6*fbm(x*0.08,z*0.08); const d0=Math.hypot(x-cx,z-cz); h+=smooth01((d0-R0-250)/400)*40*fbm(x*0.003+7,z*0.003);
      for(const m of mesas){ const d=Math.hypot(x-m[0],z-m[1]); const rn=m[2]*(0.85+0.3*fbm(x*0.02+m[0],z*0.02)); const k=smooth01((rn+14-d)/14); if(k>0) h=Math.max(h,m[3]*k+(k>0.99?1.5*fbm(x*0.05,z*0.05):0)); }
      return chan(x,z,h); }; }
  else if(t==='coast') f=(x,z)=>{ const coastX=-38+14*Math.sin(z*0.012)+8*Math.sin(z*0.031); const land=smooth01((x-coastX+45)/55);
      const hills=6+62*fbm(x*0.006+3,z*0.006)*smooth01((x-coastX)/220+0.25); return lerp(-26,hills,land); };
  else if(t==='country'){ const ck=def.creek||[]; const creekD=(x,z)=>{ let best=1e9; for(let k=0;k<ck.length-1;k++){ const [ax,az]=ck[k],[bx,bz]=ck[k+1]; const vx=bx-ax,vz=bz-az,L2=vx*vx+vz*vz; const tt=clamp(((x-ax)*vx+(z-az)*vz)/L2,0,1); best=Math.min(best,Math.hypot(x-ax-vx*tt,z-az-vz*tt)); } return best; };
    f=(x,z)=>{ const d0=Math.hypot(x-cx,z-cz); let h=4.5*fbm(x*0.007+11,z*0.007)+1.2*fbm(x*0.03,z*0.03)-1.5; h+=smooth01((d0-R0-120)/350)*55*fbm(x*0.0035+4,z*0.0035);
      if(ck.length){ const cd=creekD(x,z); if(cd<22) h=lerp(-7,h,smooth01((cd-5)/17)); } return h; }; f.creekD=creekD; }
  else f=(x,z)=>{ return chan(x,z,0.0); };
  f.cx=cx; f.cz=cz; f.R0=R0; f.channels=channels; return f;
}
function buildWorld(def,P,Q){
  seed(def.id.length*1337+7);
  const th=THEMES[def.sky||def.theme]; const W={group:new THREE.Group(),updaters:[],obstacles:[],items:[],pads:[],slicks:[],th,def,P};
  const G=W.group; const hash=buildRoadHash(P); W.hash=hash;
  const nat=naturalHeightFn(def,P);
  const heightAt=(x,z)=>{ const b=nat(x,z); const inf=hash(x,z); if(inf.i<0||inf.gap) return b; const near=inf.edge+7; const flat=inf.y-0.35; if(inf.d<near) return flat; return lerp(flat,b,smooth01((inf.d-near)/40)); };
  W.heightAt=heightAt;
  const clearOfRoad=(x,z,m)=>{ const inf=hash(x,z,4); return inf.i<0||inf.d>inf.edge+m; };
  // ---------- lights / sky / fog ----------
  const sunDir=new THREE.Vector3(...th.sunDir).normalize();
  const hemi=new THREE.HemisphereLight(th.hemiS,th.hemiG,th.hemiI); G.add(hemi);
  const sun=new THREE.DirectionalLight(th.sunCol,th.sunI); sun.position.copy(sunDir).multiplyScalar(200); G.add(sun); G.add(sun.target);
  if(Q.shadows){ sun.castShadow=true; sun.shadow.mapSize.set(Q.shadowSize,Q.shadowSize); const c=sun.shadow.camera; c.left=-70;c.right=70;c.top=70;c.bottom=-70;c.near=10;c.far=500; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03; }
  W.sun=sun; W.sunDir=sunDir;
  G.add(makeSky(th,2600));
  W.fog=new THREE.Fog(th.fog,th.fogNear,th.fogFar*Q.fogMul);
  // ---------- terrain ----------
  let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; for(let i=0;i<P.N;i++){minx=Math.min(minx,P.x[i]);maxx=Math.max(maxx,P.x[i]);minz=Math.min(minz,P.z[i]);maxz=Math.max(maxz,P.z[i]);}
  W.bounds={minx,maxx,minz,maxz};
  const EXT=def.theme==='city'?650:750, cell=Q.terrainCell;
  const tw=maxx-minx+EXT*2, td=maxz-minz+EXT*2; const nx=Math.ceil(tw/cell), nz=Math.ceil(td/cell);
  const tg=new THREE.PlaneGeometry(tw,td,nx,nz); tg.rotateX(-Math.PI/2); tg.translate((minx+maxx)/2,0,(minz+maxz)/2);
  const tp=tg.attributes.position; const cols=new Float32Array(tp.count*3); const dists=new Float32Array(tp.count);
  for(let v=0;v<tp.count;v++){ const x=tp.getX(v),z=tp.getZ(v); tp.setY(v,heightAt(x,z)); const inf=hash(x,z); dists[v]=inf.i<0?999:inf.d-inf.edge; }
  tg.computeVertexNormals(); const tn=tg.attributes.normal;
  for(let v=0;v<tp.count;v++){ const x=tp.getX(v),z=tp.getZ(v),y=tp.getY(v); const slope=1-tn.getY(v); const n=fbm(x*0.03,z*0.03), n2=vnoise(x*0.2,z*0.2); let c;
    const dd=dists[v];
    if(def.theme==='city'){ if(dd<9) c=[0.62,0.6,0.56]; else if(y>6) c=lerp3([0.62,0.55,0.36],[0.38,0.44,0.26],n); else c=n>0.52?[0.4,0.47,0.25]:[0.5,0.48,0.44]; c=lerp3(c,[0.55,0.5,0.4],slope*2); }
    else if(def.theme==='desert'){ c=lerp3([0.86,0.63,0.42],[0.78,0.52,0.34],n); if(y>5){ const band=0.5+0.5*Math.sin(y*1.3+n*3); c=lerp3([0.72,0.36,0.2],[0.84,0.52,0.32],band); } if(slope>0.25) c=lerp3(c,[0.6,0.3,0.18],clamp((slope-0.25)*2,0,1)); }
    else if(def.theme==='country'){ c=lerp3([0.34,0.52,0.2],[0.6,0.58,0.28],smooth01((n-0.4)*2.5)); if(y<-3) c=lerp3([0.42,0.3,0.18],c,smooth01((y+6)/3)); if(slope>0.35) c=lerp3(c,[0.55,0.32,0.18],clamp((slope-0.35)*2,0,1)); }
    else if(def.theme==='coast'){ if(y<-1.5) c=[0.82,0.74,0.56]; else c=lerp3([0.72,0.62,0.34],[0.36,0.46,0.22],smooth01((n-0.35)*3)); if(slope>0.3) c=lerp3(c,[0.47,0.42,0.37],clamp((slope-0.3)*2.5,0,1)); if(y<-8) c=[0.55,0.5,0.42]; }
    else { c=lerp3([0.1,0.1,0.13],[0.16,0.15,0.18],n); if(dd<10) c=[0.14,0.14,0.17]; if(y<-3) c=[0.08,0.08,0.1]; }
    const k=0.9+0.2*n2; cols[v*3]=c[0]*k; cols[v*3+1]=c[1]*k; cols[v*3+2]=c[2]*k; }
  tg.setAttribute('color',new THREE.BufferAttribute(cols,3));
  const detail=canvasTex(256,256,(g,w,h)=>{noiseFill(g,w,h,'#bfbfbf',70);},{repeat:true}); detail.repeat.set(tw/12,td/12);
  const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,map:detail,roughness:0.97})); terrain.receiveShadow=true; G.add(terrain);
  // ---------- road surfaces ----------
  const ptAt=(i,lat,dy)=>[P.x[i]+P.rx[i]*lat,P.y[i]+dy,P.z[i]+P.rz[i]*lat];
  function ribbon(include,latA,latB,dyA,dyB,uA,uB,vs,normalUp=true){
    const pos=[],uv=[];
    for(let i=0;i<P.N;i++){ const j=(i+1)%P.N; if(!include(i,j)) continue;
      const a0=ptAt(i,latA(i),dyA), b0=ptAt(i,latB(i),dyB), a1=ptAt(j,latA(j),dyA), b1=ptAt(j,latB(j),dyB);
      const v0=i*P.spacing/vs, v1=(i+1)*P.spacing/vs;
      pos.push(...a0,...b0,...a1,...b0,...b1,...a1); uv.push(uA,v0,uB,v0,uA,v1,uB,v0,uB,v1,uA,v1); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    g.computeVertexNormals(); return g;
  }
  const notGap=(i,j)=>!P.gap[i]&&!P.gap[j];
  const roadMat=new THREE.MeshStandardMaterial({map:roadTexture(th),roughness:th.night?0.28:0.85,metalness:th.night?0.35:0.0});
  const road=new THREE.Mesh(ribbon(notGap,i=>-P.w[i]/2,i=>P.w[i]/2,0,0,0,1,26),roadMat); road.receiveShadow=true; G.add(road); W.roadMat=roadMat;
  // curbs: corner curbs vs edge strip
  const isCorner=i=>Math.abs(P.curv[i])>1/110;
  const curbMat=new THREE.MeshStandardMaterial({map:stripTex(th.curbA,th.curbB),roughness:0.6,emissive:th.night?0xff2e97:0,emissiveIntensity:th.night?0.25:0});
  const edgeMat=new THREE.MeshStandardMaterial({color:th.edge,roughness:0.8});
  const shMat=new THREE.MeshStandardMaterial({map:shoulderTexture(th.shoulder),roughness:th.night?0.4:0.95,metalness:th.night?0.2:0});
  [[-1],[1]].forEach(([sd])=>{
    const la=sd<0?(i=>-P.w[i]/2-0.9):(i=>P.w[i]/2), lb=sd<0?(i=>-P.w[i]/2):(i=>P.w[i]/2+0.9);
    const c1=new THREE.Mesh(ribbon((i,j)=>notGap(i,j)&&isCorner(i),la,lb,0.04,0.04,0,1,2),curbMat); c1.receiveShadow=true; G.add(c1);
    const c2=new THREE.Mesh(ribbon((i,j)=>notGap(i,j)&&!isCorner(i),la,lb,0.02,0.02,0,1,2),edgeMat); c2.receiveShadow=true; G.add(c2);
    const sa=sd<0?(i=>-P.wl[i]-0.3):(i=>P.w[i]/2+0.9), sb=sd<0?(i=>-P.w[i]/2-0.9):(i=>P.wr[i]+0.3);
    const sh=new THREE.Mesh(ribbon(notGap,sa,sb,0.01,0.01,0,1,4),shMat); sh.receiveShadow=true; sh.material.map.repeat.set(3,1); G.add(sh);
  });
  // medians
  (def.medians||[]).forEach(m=>{
    const mg=ribbon((i,j)=>P.median[i]>0.3&&P.median[j]>0.3,i=>-P.median[i],i=>P.median[i],0.35,0.35,0,1,4);
    const mm=new THREE.Mesh(mg,new THREE.MeshStandardMaterial({color:def.theme==='night'?0x222a2a:0x6f8f3a,roughness:0.9})); G.add(mm);
    const side=ribbon((i,j)=>P.median[i]>0.3&&P.median[j]>0.3,i=>-P.median[i],i=>-P.median[i],-0.2,0.38,0,1,2);
    const side2=ribbon((i,j)=>P.median[i]>0.3&&P.median[j]>0.3,i=>P.median[i],i=>P.median[i],0.38,-0.2,0,1,2);
    const cm=new THREE.MeshStandardMaterial({color:0xd8d4cc,side:THREE.DoubleSide}); G.add(new THREE.Mesh(side,cm)); G.add(new THREE.Mesh(side2,cm));
    W.medianList=W.medianList||[]; W.medianList.push(m);
  });
  // ---------- walls ----------
  const wallMat=new THREE.MeshStandardMaterial({map:wallTexture(th.wall),roughness:th.wall==='guardrail'?0.35:0.8,metalness:th.wall==='guardrail'?0.6:0.05,side:THREE.DoubleSide});
  const railLike=th.wall==='guardrail'||th.wall==='wood'; const H=th.wallH, T=railLike?0.12:0.45;
  const wallInc=(i,j)=>notGap(i,j);
  [-1,1].forEach(sd=>{
    const L=i=>sd<0?-P.wl[i]:P.wr[i], L2=i=>sd<0?-P.wl[i]-T:P.wr[i]+T;
    const bottom=railLike?0.3:-0.5;
    const gIn=ribbon(wallInc,L,L,bottom,H,0,1,4); const gTop=ribbon(wallInc,sd<0?L2:L,sd<0?L:L2,H,H,0,0.1,4); const gOut=ribbon(wallInc,L2,L2,H,-0.6,0,1,4);
    fixWallUV(gIn); fixWallUV(gOut);
    const wm=new THREE.Mesh(mergeGeos([gIn,gTop,gOut]),wallMat); wm.castShadow=true; wm.receiveShadow=true; G.add(wm);
    if(th.wall==='neon'){ const nm=new THREE.MeshBasicMaterial({color:sd<0?0xff2e97:0x22e4ff});
      const tube=ribbon(wallInc,i=>L(i)-sd*0.05,i=>L(i)+sd*0.05*0,H+0.02,H+0.02,0,1,4); const tube2=ribbon(wallInc,L,L,H-0.18,H+0.02,0,1,4);
      G.add(new THREE.Mesh(mergeGeos([tube,tube2]),new THREE.MeshBasicMaterial({color:sd<0?0xff2e97:0x22e4ff,side:THREE.DoubleSide})));
      const glow=ribbon(wallInc,i=>L(i)-sd*1.6,L,0.03,0.03,0,1,8); const gm=new THREE.MeshBasicMaterial({map:glowStripTex(),color:sd<0?0xff2e97:0x22e4ff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0.55});
      if(sd>0){ const gg=ribbon(wallInc,i=>L(i)-1.6,L,0.03,0.03,0,1,8); G.add(new THREE.Mesh(gg,gm)); } else { const gg=ribbon(wallInc,L,i=>L(i)+1.6,0.03,0.03,1,0,8); G.add(new THREE.Mesh(gg,gm)); } }
    if(railLike){ // posts
      const pts=[]; for(let i=0;i<P.N;i+=2){ if(P.gap[i]) continue; const p=ptAt(i,L(i)+sd*0.15,0); pts.push({x:p[0],y:p[1]-0.4,z:p[2],ry:0,s:[0.12,1.2,0.12]}); }
      G.add(instanced(new THREE.BoxGeometry(1,1,1).translate(0,0.5,0),new THREE.MeshStandardMaterial(th.wall==='wood'?{color:0x5a3a20,roughness:0.9}:{color:0x7a7f84,metalness:0.6,roughness:0.4}),pts,false)); }
  });
  function fixWallUV(g){ const uv=g.attributes.uv; for(let k=0;k<uv.count;k++){ const u=uv.getX(k); uv.setXY(k,uv.getY(k),u); } }
  // ---------- start/finish ----------
  const s0=0;
  const chk=canvasTex(256,64,(g)=>{for(let x=0;x<16;x++)for(let y=0;y<4;y++){g.fillStyle=(x+y)%2?'#111':'#f4f4f4';g.fillRect(x*16,y*16,16,16);}});
  const fl=new THREE.Mesh(ribbon((i,j)=>i===0,i=>-P.w[i]/2,i=>P.w[i]/2,0.03,0.03,0,1,P.spacing),new THREE.MeshStandardMaterial({map:chk,roughness:0.6})); G.add(fl);
  // grid slots
  W.grid=[]; for(let k=0;k<8;k++){ const row=Math.floor(k/2), col=k%2; const dist=10+row*8.5+(col?4:0); const i=(P.N-Math.round(dist/P.spacing))%P.N; const lat=(col?1:-1)*P.w[i]*0.22; W.grid.push({i,lat}); 
    const p=ptAt(i,lat,0.035); const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.25),new THREE.MeshBasicMaterial({color:0xf0f0f0})); m.position.set(p[0],p[1],p[2]+0); m.rotation.set(-Math.PI/2,0,Math.atan2(P.tx[i],P.tz[i])); m.position.x+=P.tx[i]*2.6; m.position.z+=P.tz[i]*2.6; G.add(m); }
  buildGantry(W,P,0);
  // ---------- boost pads ----------
  const padTex=canvasTex(128,256,(g,w,h)=>{ g.fillStyle='rgba(10,20,40,0.6)'; g.fillRect(0,0,w,h); g.lineWidth=16; g.lineJoin='miter';
    for(let k=0;k<3;k++){ const y=h-40-k*80; g.strokeStyle=k%2?'#ff2e97':'#22e4ff'; g.beginPath(); g.moveTo(14,y+34); g.lineTo(w/2,y); g.lineTo(w-14,y+34); g.stroke(); } },{repeat:true});
  const padMat=new THREE.MeshBasicMaterial({map:padTex,transparent:true,depthWrite:false});
  (def.boosts||[]).forEach(b=>{ const i=P.idxAt(b.cp,b.f); const p=ptAt(i,b.lat,0.06); const m=new THREE.Mesh(new THREE.PlaneGeometry(4.2,7),padMat); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,Math.atan2(P.tx[i],P.tz[i])+Math.PI,0);
    m.position.set(p[0],p[1],p[2]); G.add(m); W.pads.push({i,lat:b.lat,along:i*P.spacing,half:3.5,hw:2.2}); });
  W.updaters.push((dt,t)=>{ padTex.offset.y=(t*1.6)%1; });
  // ---------- item prisms ----------
  const prismGeo=new THREE.OctahedronGeometry(0.85,0);
  const prismMat=new THREE.MeshStandardMaterial({color:0xff4fb0,emissive:0x9b1cff,emissiveIntensity:0.6,metalness:0.3,roughness:0.15,transparent:true,opacity:0.88});
  const coreMat=new THREE.MeshBasicMaterial({color:0x7ff6ff});
  (def.items||[]).forEach(it=>{ const i=P.idxAt(it.cp,it.f); const n=Math.max(3,Math.floor(P.w[i]/4)); for(let k=0;k<n;k++){ const lat=(k-(n-1)/2)*(P.w[i]-3)/(n-1); const p=ptAt(i,lat,1.2);
    const grp=new THREE.Group(); const m=new THREE.Mesh(prismGeo,prismMat); m.castShadow=true; grp.add(m); const c=new THREE.Mesh(new THREE.IcosahedronGeometry(0.28,0),coreMat); grp.add(c); grp.position.set(p[0],p[1],p[2]); G.add(grp);
    W.items.push({x:p[0],y:p[1],z:p[2],i,lat,active:true,t:0,grp,spin:k}); } });
  W.updaters.push((dt,t)=>{ W.items.forEach(b=>{ if(!b.active){ b.t-=dt; if(b.t<=0){b.active=true;b.grp.visible=true; b.grp.scale.setScalar(0.01);} } else { const s=b.grp.scale.x; if(s<1) b.grp.scale.setScalar(Math.min(1,s+dt*3)); } b.grp.rotation.y=t*1.6+b.spin; b.grp.rotation.x=Math.sin(t*1.2+b.spin)*0.3; b.grp.position.y=b.y+Math.sin(t*2+b.spin)*0.18; }); });
  // theme scenery
  W.nat=nat; buildScenery(W,def,P,Q,{heightAt,clearOfRoad,ptAt,hash,nat,ribbon,notGap});
  // minimap outline
  W.mini=[]; for(let i=0;i<P.N;i+=3) W.mini.push([P.x[i],P.z[i]]);
  W.update=(dt,t)=>W.updaters.forEach(f=>f(dt,t));
  return W;
}
function lerp3(a,b,t){return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];}
let _glowStrip=null; function glowStripTex(){ if(_glowStrip) return _glowStrip; _glowStrip=canvasTex(64,16,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=gr;g.fillRect(0,0,w,h);}); return _glowStrip; }
function instanced(geo,mat,list,cast=true,recv=false){
  const m=new THREE.InstancedMesh(geo,mat,Math.max(1,list.length)); const o=new THREE.Object3D(); const col=new THREE.Color();
  list.forEach((p,k)=>{ o.position.set(p.x,p.y,p.z); o.rotation.set(p.rx||0,p.ry||0,p.rz||0); if(Array.isArray(p.s)) o.scale.set(p.s[0],p.s[1],p.s[2]); else o.scale.setScalar(p.s||1); o.updateMatrix(); m.setMatrixAt(k,o.matrix); col.set(p.c!==undefined?p.c:0xffffff); m.setColorAt(k,col); });
  if(!list.length){ col.set(0xffffff); m.setColorAt(0,col); }
  m.count=list.length; m.castShadow=cast; m.receiveShadow=recv; if(m.instanceColor) m.instanceColor.needsUpdate=true; return m;
}
function textPanelTex(lines,opts={}){
  const w=opts.w||512,h=opts.h||256;
  return canvasTex(w,h,(g)=>{ g.fillStyle=opts.bg||'#111'; g.fillRect(0,0,w,h); if(opts.border){ g.strokeStyle=opts.border; g.lineWidth=12; g.strokeRect(8,8,w-16,h-16); }
    lines.forEach(L=>{ g.font=L.font; g.fillStyle=L.color; g.textAlign='center'; g.textBaseline='middle'; if(L.glow){ g.shadowColor=L.glow; g.shadowBlur=20; } g.fillText(L.text,w/2,L.y*h); g.shadowBlur=0; }); });
}
function buildGantry(W,P,i){
  const G=W.group, w=P.w[i]/2+2.2, ang=Math.atan2(P.tx[i],P.tz[i]);
  const grp=new THREE.Group(); grp.position.set(P.x[i],P.y[i],P.z[i]); grp.rotation.y=ang; G.add(grp);
  const dark=new THREE.MeshStandardMaterial({color:0x1b1b24,metalness:0.6,roughness:0.4});
  [-1,1].forEach(s=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.8,8,0.8),dark); p.position.set(s*w,4,0); p.castShadow=true; grp.add(p); });
  const beam=new THREE.Mesh(new THREE.BoxGeometry(w*2+0.8,1.9,0.9),dark); beam.position.y=8.4; beam.castShadow=true; grp.add(beam);
  const tex=textPanelTex([{text:"RYDEN'S RACERS",font:'italic 120px "Racing Sans One", Impact, sans-serif',color:'#ff4fb0',glow:'#ff2e97',y:0.55}],{w:1024,h:192,bg:'#12081f'});
  [1,-1].forEach(sd=>{ const b=new THREE.Mesh(new THREE.PlaneGeometry(w*1.7,1.6),new THREE.MeshBasicMaterial({map:tex})); b.position.set(0,8.4,-sd*0.46); if(sd>0) b.rotation.y=Math.PI; grp.add(b); });
  // countdown lamps (facing approaching cars: -z side)
  W.lamps=[]; for(let k=0;k<5;k++){ const m=new THREE.Mesh(new THREE.CircleGeometry(0.34,16),new THREE.MeshBasicMaterial({color:0x220808})); m.position.set((k-2)*0.95,6.9,-0.47); m.rotation.y=Math.PI; grp.add(m); W.lamps.push(m.material); }
  const hous=new THREE.Mesh(new THREE.BoxGeometry(5.2,1,0.3),dark); hous.position.set(0,6.9,-0.3); grp.add(hous);
}

// ===== THEMED SCENERY =====
let _glowTex=null; function glowTex(){ if(_glowTex) return _glowTex; _glowTex=canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.25,'rgba(255,255,255,0.5)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);}); return _glowTex; }
function glowSprite(color,size,op=0.8){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:op,fog:false})); s.scale.set(size,size,1); return s; }
function palmGeos(){
  const trunk=new THREE.CylinderGeometry(0.17,0.3,1,6,3); trunk.translate(0,0.5,0); const trunk2=tintGeo(trunk,0x8a6a48);
  const fr=[]; for(let k=0;k<9;k++){ const g=new THREE.PlaneGeometry(0.9,4.2,1,5); const p=g.attributes.position;
    for(let v=0;v<p.count;v++){ const y=p.getY(v)+2.1; const w=Math.sin(y/4.2*Math.PI)*1.0; p.setX(v,p.getX(v)*w); p.setZ(v,y); p.setY(v,-0.08*y*y+0.5*y*0.4); }
    g.rotateY(k/9*TAU+(k%2)*0.2); fr.push(tintGeo(g,k%2?0x3f7a2c:0x2f6a26)); }
  const crown=mergeGeos(fr); crown.computeVertexNormals();
  return {trunk:trunk2,crown};
}
function saguaroGeo(){ const parts=[]; const c=(r,h,x,y,z)=>{const g=new THREE.CylinderGeometry(r,r,h,8);g.translate(x,y+h/2,z);parts.push(g);const s=new THREE.SphereGeometry(r,8,5,0,TAU,0,Math.PI/2);s.translate(x,y+h,z);parts.push(s);};
  c(0.38,5.2,0,0,0); c(0.26,1.8,0.9,2.2,0); c(0.26,1.4,-0.85,2.8,0); const a=new THREE.CylinderGeometry(0.24,0.24,0.9,8); a.rotateZ(Math.PI/2); a.translate(0.5,2.3,0); parts.push(a); const b=new THREE.CylinderGeometry(0.24,0.24,0.8,8); b.rotateZ(Math.PI/2); b.translate(-0.45,2.9,0); parts.push(b);
  const g=mergeGeos(parts.map(p=>tintGeo(p,0x4d7a3a))); g.computeVertexNormals(); return g; }
function rockGeo(seedv){ const g=new THREE.IcosahedronGeometry(1,1); const p=g.attributes.position; for(let v=0;v<p.count;v++){ const x=p.getX(v),y=p.getY(v),z=p.getZ(v); const n=0.75+0.5*vnoise(x*1.7+seedv,z*1.7+y); p.setXYZ(v,x*n,y*n*0.75,z*n);} g.computeVertexNormals(); return g; }
function coneTreeGeo(col){ const parts=[]; const t=new THREE.CylinderGeometry(0.15,0.22,2,5); t.translate(0,1,0); parts.push(tintGeo(t,0x5a4030));
  for(let k=0;k<3;k++){ const c=new THREE.ConeGeometry(1.5-k*0.35,2.6,7); c.translate(0,2.2+k*1.5,0); parts.push(tintGeo(c,col)); } const g=mergeGeos(parts); g.computeVertexNormals(); return g; }
function cypressGeo(){ const parts=[]; const t=new THREE.CylinderGeometry(0.2,0.3,3,5); t.translate(0,1.5,0); t.rotateZ(0.15); parts.push(tintGeo(t,0x5a4030));
  [[0.3,3.2,0,2.2],[1.2,3.6,0.4,1.8],[-1,3.4,-0.3,1.6],[0.5,4.2,0.2,1.4]].forEach(([x,y,z,r])=>{ const s=new THREE.SphereGeometry(r,7,5); s.scale(1.3,0.55,1.1); s.translate(x,y,z); parts.push(tintGeo(s,0x2f5a2a)); });
  const g=mergeGeos(parts); g.computeVertexNormals(); return g; }
function facadeTex(kind){
  return canvasTex(512,256,(g,w,h)=>{
    if(kind==='shop'){ noiseFill(g,w,h,'#eeeeee',14); g.fillStyle='rgba(0,0,0,0.12)'; g.fillRect(0,h-18,w,18);
      const sc=['#ff2e97','#1fb6ff','#ffb000','#2ecc71','#8e44ff','#ff5a36']; g.fillStyle=sc[Math.floor(Math.random()*6)]; g.fillRect(20,20,w-40,44);
      g.fillStyle='rgba(255,255,255,0.9)'; for(let k=0;k<8;k++) g.fillRect(40+k*55,34,34,16);
      g.fillStyle='#1d2433'; g.fillRect(24,90,200,130); g.fillRect(280,90,120,130); g.fillStyle='#343f55'; g.fillRect(420,110,70,110);
      g.fillStyle='rgba(180,220,255,0.25)'; g.fillRect(30,96,90,60); g.fillRect(290,96,50,60); }
    else if(kind==='villa'){ noiseFill(g,w,h,'#f4efe4',10); g.fillStyle='#2a3a4a'; for(let k=0;k<4;k++){ g.fillRect(40+k*120,60,50,70); g.fillStyle='#3a6ea5'; g.fillRect(34+k*120,56,8,78); g.fillRect(88+k*120,56,8,78); g.fillStyle='#2a3a4a'; } }
    else if(kind==='warehouse'){ noiseFill(g,w,h,'#3a3d46',14); for(let x=0;x<w;x+=8){ g.fillStyle='rgba(0,0,0,0.25)'; g.fillRect(x,0,3,h);} g.fillStyle='rgba(0,0,0,0.4)'; g.fillRect(40,h-120,120,120); }
    else if(kind==='warehouseE'){ g.fillStyle='#000'; g.fillRect(0,0,w,h); for(let r=0;r<3;r++) for(let c=0;c<10;c++) if(Math.random()<0.55){ g.fillStyle=Math.random()<0.7?'#ffb34d':'#9fd8ff'; g.fillRect(14+c*50,20+r*40,34,20);} }
    else if(kind==='tower'){ g.fillStyle='#000'; g.fillRect(0,0,w,h); for(let r=0;r<16;r++) for(let c=0;c<16;c++) if(Math.random()<0.45){ g.fillStyle=['#ffd58a','#a8d8ff','#ff8ad0'][Math.floor(Math.random()*3)]; g.fillRect(8+c*31,6+r*15,18,8);} }
  },{repeat:true});
}
function buildScenery(W,def,P,Q,H){
  const G=W.group, th=W.th, D=Q.density, {heightAt,clearOfRoad,ptAt,hash}=H;
  const scatter=(n,minD,maxD,margin,fn)=>{ const out=[]; let tries=0; n=Math.round(n*D); while(out.length<n&&tries<n*10){ tries++; const i=Math.floor(rnd()*P.N); const sd=rnd()<0.5?-1:1; const e=sd<0?P.wl[i]:P.wr[i]; const d=e+rr(minD,maxD);
      const x=P.x[i]+P.rx[i]*d*sd, z=P.z[i]+P.rz[i]*d*sd; if(!clearOfRoad(x,z,margin)) continue; if(typeof freeOfProps==='function' && !freeOfProps(x,z,5)) continue; const y=heightAt(x,z); const r=fn?fn(x,y,z,i,sd):{x,y,z,ry:rnd()*TAU}; if(r) out.push(r);} return out; };
  const areaScatter=(n,margin,fn)=>{ const out=[]; const b=W.bounds; let tries=0; n=Math.round(n*D); while(out.length<n&&tries<n*6){ tries++; const x=rr(b.minx-350,b.maxx+350), z=rr(b.minz-350,b.maxz+350); if(!clearOfRoad(x,z,margin)) continue; const y=heightAt(x,z); const r=fn(x,y,z); if(r) out.push(r);} return out; };
  const footprintClear=(x,z,ang,w,d,m)=>{ const ca=Math.cos(ang),sa=Math.sin(ang); for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,0],[0,1],[0,-1],[1,0],[-1,0]]){ const px=x+(a*w/2)*ca+(b*d/2)*sa, pz=z-(a*w/2)*sa+(b*d/2)*ca; if(!clearOfRoad(px,pz,m)) return false; } return true; };
  const stdMat=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:0.85},o));
  var freeOfProps; const PB=placeTrackProps(W,def,P,{heightAt,footprintClear}); freeOfProps=(x,z,r)=>!PB.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+r);
  const vcMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.85,side:THREE.DoubleSide});
  const addPoles=(i0,i1,side,every,height,wires)=>{ const posts=[],lines=[]; let prev=null;
    for(let i=i0;i<i1;i+=every){ const k=i%P.N; const e=(side<0?P.wl[k]:P.wr[k])+2.5; const x=P.x[k]+P.rx[k]*e*side, z=P.z[k]+P.rz[k]*e*side; const y=heightAt(x,z);
      posts.push({x,y,z,ry:Math.atan2(P.tx[k],P.tz[k])}); const top=[x,y+height,z]; if(prev&&wires) for(let w=-1;w<=1;w++){ const ox=P.rx[k]*w*1.1, oz=P.rz[k]*w*1.1; lines.push(prev[0]+prev[3]*w*1.1,prev[1],prev[2]+prev[4]*w*1.1, top[0]+ox,top[1],top[2]+oz);} prev=[...top,P.rx[k],P.rz[k]]; }
    const pole=new THREE.CylinderGeometry(0.14,0.2,height,6); pole.translate(0,height/2,0); const bar=new THREE.BoxGeometry(2.6,0.14,0.14); bar.translate(0,height-0.2,0); bar.rotateY(Math.PI/2);
    G.add(instanced(mergeGeos([pole,bar]),stdMat(0x5b4633),posts));
    if(lines.length){ const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(lines,3)); G.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x222222}))); } };
  const billboard=(i,side,dist,lines,bg,h=9)=>{ const k=i%P.N; const e=(side<0?P.wl[k]:P.wr[k])+dist; const x=P.x[k]+P.rx[k]*e*side, z=P.z[k]+P.rz[k]*e*side; const y=heightAt(x,z);
    const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[k],P.tz[k])+(side<0?-1:1)*0.6+Math.PI; G.add(grp);
    const tex=textPanelTex(lines,{w:1024,h:512,bg,border:'#ffffff'}); const b=new THREE.Mesh(new THREE.BoxGeometry(12,6,0.3),[stdMat(0x222222),stdMat(0x222222),stdMat(0x222222),stdMat(0x222222),new THREE.MeshStandardMaterial({map:tex,roughness:0.6,emissive:th.night?0xffffff:0,emissiveMap:th.night?tex:null,emissiveIntensity:0.8}),stdMat(0x333333)]);
    b.position.y=h; b.castShadow=true; grp.add(b); [-4,4].forEach(px=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(0.4,h,0.4),stdMat(0x444444,{metalness:0.5})); p.position.set(px,h/2-1.5,0); grp.add(p); }); return grp; };
  // chevron boards on tight corners
  const chevTex=canvasTex(256,128,(g,w,h)=>{ g.fillStyle=th.night?'#0a0a14':'#f4f4f4'; g.fillRect(0,0,w,h); g.fillStyle=th.night?'#22e4ff':'#d8262b'; for(let k=0;k<3;k++){ g.beginPath(); const x=30+k*75; g.moveTo(x,10); g.lineTo(x+45,64); g.lineTo(x,118); g.lineTo(x+22,118); g.lineTo(x+67,64); g.lineTo(x+22,10); g.fill(); } });
  const chevMat=new THREE.MeshStandardMaterial({map:chevTex,emissive:th.night?0xffffff:0,emissiveMap:th.night?chevTex:null,emissiveIntensity:1,roughness:0.6});
  for(let i=0;i<P.N;i+=7){ const c=P.curv[i]; if(Math.abs(c)<1/48||P.gap[i]) continue; const side=c>0?-1:1; const e=(side<0?P.wl[i]:P.wr[i])+0.8; const p=ptAt(i,e*side,0);
    const m=new THREE.Mesh(new THREE.BoxGeometry(2.4,1.2,0.12),chevMat); m.position.set(p[0],p[1]+1.9,p[2]); m.rotation.y=Math.atan2(-P.rx[i]*side,-P.rz[i]*side); m.scale.x=side>0?-1:1; G.add(m); }
  // grandstand at start (all tracks)
  { const i=Math.round(22/P.spacing); const side=1; const e=P.wr[i]+4; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i]); G.add(grp);
    const crowd=[]; for(let r=0;r<6;r++){ const st=new THREE.Mesh(new THREE.BoxGeometry(6+r*0,1,40),stdMat(th.night?0x2a2a38:0xb0aca4)); st.position.set(-(r*1.6+2),r*1.0+0.5,0); st.scale.x=0.3; st.receiveShadow=true; grp.add(st);
      for(let c=0;c<26;c++) if(rnd()<0.8) crowd.push({x:-(r*1.6+2),y:r*1.0+1.4,z:-19+c*1.5+rr(-0.3,0.3),s:[0.5,0.8+rnd()*0.3,0.5],c:pick([0xff2e97,0x22e4ff,0xffd23f,0xffffff,0x2b2b2b,0xe74c3c,0x3498db,0x8e44ad])}); }
    const base=new THREE.Mesh(new THREE.BoxGeometry(10,7,42),stdMat(th.night?0x1e1e2a:0x9d978c)); base.position.set(-7,2.5,0); base.castShadow=true; grp.add(base);
    const roof=new THREE.Mesh(new THREE.BoxGeometry(12,0.4,44),stdMat(0xff2e97)); roof.position.set(-7,10.5,0); roof.rotation.z=-0.12; roof.castShadow=true; grp.add(roof);
    grp.add(instanced(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:0.8}),crowd,false)); }

  if(def.theme==='city'){
    const {trunk,crown}=palmGeos();
    const palms=scatter(110,3,60,3,(x,y,z)=>({x,y,z,ry:rnd()*TAU,h:rr(10,17)}));
    for(let i=0;i<P.N;i+=8){ if(i>P.cpIdx[3]&&i<P.cpIdx[21]) continue; [-1,1].forEach(sd=>{ const e=(sd<0?P.wl[i]:P.wr[i])+2.5; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; palms.push({x,y:heightAt(x,z),z,ry:rnd()*TAU,h:rr(13,17)}); }); }
    for(let i=0;i<P.N;i+=9){ if(P.median[i]>1.2){ palms.push({x:P.x[i],y:P.y[i]+0.3,z:P.z[i],ry:rnd()*TAU,h:rr(8,11)}); } }
    for(let q=palms.length-1;q>=0;q--) if(!freeOfProps(palms[q].x,palms[q].z,1.5)) palms.splice(q,1);
    const PT=(typeof propTemplate==='function')?propTemplate('palm'):null;
    if(PT){ PT.parts.forEach(pp=>G.add(instanced(pp.g,pp.mt,palms.map(p=>({x:p.x,y:p.y,z:p.z,ry:p.ry,s:p.h/PT.h*0.85})),true))); }
    else { G.add(instanced(trunk,vcMat,palms.map(p=>({x:p.x,y:p.y,z:p.z,ry:p.ry,s:[1+p.h*0.03,p.h,1+p.h*0.03]}))));
    G.add(instanced(crown,vcMat,palms.map(p=>({x:p.x,y:p.y+p.h-0.2,z:p.z,ry:p.ry,s:1.15})))); }
    // buildings
    const facades=[facadeTex('shop'),facadeTex('shop'),facadeTex('shop')]; const roofM=stdMat(0x8a8580);
    const blds=[[],[],[]];
    scatter(150,9,70,5,(x,y,z,i,sd)=>{ const ang=Math.atan2(P.tx[i],P.tz[i])+(sd>0?Math.PI/2:-Math.PI/2); const w=rr(11,20),d=rr(10,16),h=rr(4.5,9);
      if(!footprintClear(x,z,ang,w,d,4) || !freeOfProps(x,z,Math.max(w,d)/2)) return null; blds[Math.floor(rnd()*3)].push({x,y:y-0.2,z,ry:ang,s:[w,h,d],c:pick([0xf2e3c6,0xe8c7a0,0xcfe0d8,0xf0c9c9,0xd9d4f0,0xf7efe0,0xe0b98f,0xa9d6e5])}); return {}; });
    const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0);
    blds.forEach((l,k)=>{ const fm=new THREE.MeshStandardMaterial({map:facades[k],roughness:0.85}); if(l.length){ const m=instanced(bg,[fm,fm,roofM,roofM,fm,fm],l,true,true); G.add(m);} });
    addPoles(P.cpIdx[3],P.cpIdx[11],-1,14,9,true); addPoles(P.cpIdx[17],P.cpIdx[23],1,14,9,true);
    // street lamps
    const lamps=[]; for(let i=0;i<P.N;i+=18){ const sd=(i/18)%2?1:-1; const e=(sd<0?P.wl[i]:P.wr[i])+1.2; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; lamps.push({x,y:heightAt(x,z),z,ry:Math.atan2(P.rx[i]*-sd,P.rz[i]*-sd)}); }
    const lp=new THREE.CylinderGeometry(0.1,0.14,7,6); lp.translate(0,3.5,0); const la=new THREE.BoxGeometry(0.2,0.2,2); la.translate(0,7,1); G.add(instanced(mergeGeos([lp,la]),stdMat(0x3a3a3a,{metalness:0.6}),lamps));
    // landmark: retro Ryden's sign
    { const i=P.cpIdx[3]; const e=P.wl[i]+9; const x=P.x[i]-P.rx[i]*e, z=P.z[i]-P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i])+2.2; G.add(grp);
      const tex=canvasTex(1024,512,(g,w,h)=>{ g.fillStyle='#f6f0e2'; g.beginPath(); g.moveTo(40,120); g.lineTo(w-60,40); g.lineTo(w-20,h-120); g.lineTo(60,h-40); g.fill(); g.strokeStyle='#27c6d9'; g.lineWidth=18; g.stroke();
        g.font='italic 150px Yellowtail, cursive'; g.fillStyle='#ff2e97'; g.textAlign='center'; g.fillText("Ryden's",w/2,230); g.font='italic 150px "Racing Sans One", Impact'; g.fillStyle='#1e7fd0'; g.strokeStyle='#fff'; g.lineWidth=6; g.strokeText('RACERS',w/2,390); g.fillText('RACERS',w/2,390); });
      const sgn=new THREE.Mesh(new THREE.PlaneGeometry(14,7),new THREE.MeshStandardMaterial({map:tex,transparent:true,side:THREE.DoubleSide,roughness:0.5,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:0.25})); sgn.position.y=15; grp.add(sgn);
      const pl=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,15,8),stdMat(0x6b6f75,{metalness:0.6})); pl.position.y=7.5; pl.castShadow=true; grp.add(pl); }
    // landmark: donut shop with giant donut
    { const i=P.cpIdx[15]; const sd=1; const e=P.wr[i]+18; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i]); G.add(grp);
      const b=new THREE.Mesh(new THREE.BoxGeometry(14,5,12),stdMat(0xfff3e6)); b.position.y=2.5; b.castShadow=true; grp.add(b);
      const dough=new THREE.Mesh(new THREE.TorusGeometry(4,1.9,16,40),stdMat(0xd9a15a)); dough.position.set(0,11,0); dough.rotation.y=Math.PI/2; dough.castShadow=true; grp.add(dough);
      const ic=new THREE.Mesh(new THREE.TorusGeometry(4,1.95,16,40,Math.PI*2),new THREE.MeshStandardMaterial({map:liveryTexture('sprinkles'),roughness:0.5})); ic.scale.set(1,1,0.7); ic.position.set(0.35,11,0); ic.rotation.y=Math.PI/2; grp.add(ic);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(10,1.6),new THREE.MeshBasicMaterial({map:textPanelTex([{text:'GLAZE EM DONUTS',font:'bold 90px "Racing Sans One",Impact',color:'#ff2e97',y:0.55}],{w:1024,h:160,bg:'#fff'})})); sg.position.set(-7.05,4,0); sg.rotation.y=-Math.PI/2; grp.add(sg); }
    billboard(P.cpIdx[8],1,10,[{text:'RIMFIRE GAMES',font:'bold 130px "Racing Sans One",Impact',color:'#ffd23f',y:0.4},{text:'presents',font:'italic 70px Yellowtail',color:'#fff',y:0.72}],'#1a0f33');
    billboard(P.cpIdx[19],-1,8,[{text:'MISSILE',font:'bold 150px "Racing Sans One",Impact',color:'#d4a33a',y:0.35},{text:'COMMANDER TRUCKS',font:'bold 80px "Chakra Petch"',color:'#fff',y:0.72}],'#111');
    // distant skyline (downtown)
    const tw=facadeTex('tower'); const towers=[]; for(let k=0;k<26;k++){ const a=-0.6+k*0.05+rr(-0.02,0.02); const r=rr(820,980); towers.push({x:W.nat.cx+Math.sin(a)*r,y:0,z:W.nat.cz+Math.cos(a)*r,ry:rnd(),s:[rr(25,45),rr(60,190),rr(25,45)]}); }
    const tg=new THREE.BoxGeometry(1,1,1); tg.translate(0,0.5,0); G.add(instanced(tg,new THREE.MeshStandardMaterial({color:0x8ea3b8,roughness:0.6,metalness:0.3}),towers,false));
  }
  if(def.theme==='desert'){
    const sag=saguaroGeo(); G.add(instanced(sag,vcMat,scatter(170,3,140,2,(x,y,z)=>({x,y:y-0.2,z,ry:rnd()*TAU,s:rr(0.8,1.5)}))));
    const rocks=[0,1,2].map(k=>rockGeo(k*10)); const rockMat=new THREE.MeshStandardMaterial({color:0xa65a34,roughness:0.95,flatShading:true});
    rocks.forEach(g=>G.add(instanced(g,rockMat,scatter(70,2,160,2,(x,y,z)=>{const s=rr(0.8,5);return {x,y:y+s*0.1,z,ry:rnd()*TAU,s:[s*rr(1,1.8),s,s*rr(1,1.6)],c:pick([0xffffff,0xd8b8a0,0xc09070])};}),true,true)));
    const shrub=new THREE.IcosahedronGeometry(0.8,0); G.add(instanced(shrub,new THREE.MeshStandardMaterial({color:0x8a8a4a,roughness:1,flatShading:true}),scatter(300,1,120,1.5,(x,y,z)=>({x,y,z,s:[rr(0.6,1.4),rr(0.4,0.8),rr(0.6,1.4)],ry:rnd()*TAU})),false));
    addPoles(P.cpIdx[0]+4,P.cpIdx[3],1,16,8,true); addPoles(P.cpIdx[19],P.cpIdx[22]+20,1,16,8,true);
    // rock arch over the straight
    { const i=P.idxAt(1,0.55); const R=Math.max(P.wl[i],P.wr[i])+5; const arch=new THREE.Mesh(new THREE.TorusGeometry(R,3.6,8,28,Math.PI),new THREE.MeshStandardMaterial({color:0xb4643a,roughness:0.95,flatShading:true}));
      const p=arch.geometry.attributes.position; for(let v=0;v<p.count;v++){ const x=p.getX(v),y=p.getY(v),z=p.getZ(v); const n=0.8+0.45*vnoise(x*0.3+3,y*0.3+z); p.setXYZ(v,x+(x/R)*n*0.8,y*1.0+n,z*n*1.4);} arch.geometry.computeVertexNormals();
      arch.position.set(P.x[i],P.y[i]-3,P.z[i]); arch.rotation.y=Math.atan2(P.tx[i],P.tz[i]); arch.scale.set(1,1.1,1); arch.castShadow=true; arch.receiveShadow=true; G.add(arch);
      [-1,1].forEach(s=>{ const b=new THREE.Mesh(rockGeo(s+5),arch.material); b.scale.set(7,8,7); b.position.set(P.x[i]+P.rx[i]*s*(R+1),P.y[i]-2,P.z[i]+P.rz[i]*s*(R+1)); b.castShadow=true; G.add(b); }); }
    // broken bridge stubs at the wash
    (def.jumps||[]).forEach(j=>{ if(!j.gap) return; const gl=Math.round(j.gap/P.spacing); [j.top+1,j.top+gl].forEach(i=>{ i%=P.N; [-1,1].forEach(s=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(1.2,12,1.2),stdMat(0x8d8478)); m.position.set(P.x[i]+P.rx[i]*s*P.w[i]*0.4,P.y[i]-6.3,P.z[i]+P.rz[i]*s*P.w[i]*0.4); G.add(m); }); }); });
    // gas station + water tower landmark
    { const i=P.cpIdx[20]; const e=P.wl[i]+16; const x=P.x[i]-P.rx[i]*e, z=P.z[i]-P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i])+Math.PI/2; G.add(grp);
      const canopy=new THREE.Mesh(new THREE.BoxGeometry(16,0.8,9),stdMat(0xf4f0e8)); canopy.position.y=5.5; canopy.castShadow=true; grp.add(canopy);
      const band=new THREE.Mesh(new THREE.BoxGeometry(16.2,0.5,9.2),stdMat(0xd8262b)); band.position.y=5.2; grp.add(band);
      [-6,6].forEach(px=>[-3,3].forEach(pz=>{ const c=new THREE.Mesh(new THREE.BoxGeometry(0.4,5.2,0.4),stdMat(0xdddddd)); c.position.set(px,2.6,pz); grp.add(c); }));
      const shop=new THREE.Mesh(new THREE.BoxGeometry(10,4.5,8),stdMat(0xe9dcc5)); shop.position.set(0,2.25,11); shop.castShadow=true; grp.add(shop);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(8,2),new THREE.MeshBasicMaterial({map:textPanelTex([{text:"RYDEN'S GAS",font:'italic 120px "Racing Sans One",Impact',color:'#ff2e97',y:0.55}],{w:1024,h:256,bg:'#fff8ea'})})); sg.position.set(0,5.5,-4.55); sg.rotation.y=Math.PI; grp.add(sg);
      const tower=new THREE.Group(); tower.position.set(14,0,14); grp.add(tower); const tank=new THREE.Mesh(new THREE.CylinderGeometry(4,4,5,16),stdMat(0x9fb4c0,{metalness:0.5,roughness:0.4})); tank.position.y=16; tank.castShadow=true; tower.add(tank);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(4.3,2,16),stdMat(0x7f949f)); cap.position.y=19.5; tower.add(cap);
      [[-2.5,-2.5],[2.5,-2.5],[2.5,2.5],[-2.5,2.5]].forEach(([a,b])=>{ const l=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,14,6),stdMat(0x6d6d6d)); l.position.set(a,7,b); tower.add(l); }); }
    billboard(P.cpIdx[5],-1,10,[{text:'MOJAVE MESA RUN',font:'bold 110px "Racing Sans One",Impact',color:'#ffb000',y:0.4},{text:'Next services 99 mi',font:'italic 70px "Chakra Petch"',color:'#fff',y:0.75}],'#3b1f12');
  }
  if(def.theme==='country') buildCountryScenery(W,def,P,Q,H,{scatter,areaScatter,footprintClear,stdMat,vcMat,freeOfProps});
  if(def.theme==='coast'){
    // ocean
    const ocean=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1),new THREE.ShaderMaterial({fog:true,transparent:false,
      uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:{value:0},sun:{value:W.sunDir},deep:{value:new THREE.Color(0x0e4a78)},shallow:{value:new THREE.Color(0x2e8fae)},sunc:{value:new THREE.Color(0xffc27a)}}]),
      vertexShader:'varying vec3 wp;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader:`uniform float t;uniform vec3 sun,deep,shallow,sunc;varying vec3 wp;\n#include <fog_pars_fragment>\n
        void main(){ vec2 p=wp.xz*0.05; float w=sin(p.x*2.1+t*1.2)*0.5+sin(p.y*1.7-t*0.9+p.x)*0.5+sin((p.x+p.y)*4.3+t*2.)*0.25;
          vec3 n=normalize(vec3(cos(p.x*2.1+t*1.2)*0.12,1.,cos(p.y*1.7-t*0.9)*0.12+0.05*w));
          vec3 v=normalize(cameraPosition-wp); float fr=pow(1.-max(dot(n,v),0.),3.);
          vec3 c=mix(deep,shallow,0.35+0.2*w); c=mix(c,vec3(0.95,0.75,0.6),fr*0.6);
          vec3 r=reflect(-v,n); float sp=pow(max(dot(r,normalize(sun)),0.),120.); c+=sunc*sp*3.;
          gl_FragColor=vec4(c,1.);\n#include <fog_fragment>\n}`}));
    ocean.rotation.x=-Math.PI/2; ocean.position.y=-3; G.add(ocean); W.updaters.push((dt,t)=>ocean.material.uniforms.t.value=t);
    const land=(x,z,y)=>y>0.5;
    const cyp=cypressGeo(); G.add(instanced(cyp,vcMat,scatter(150,4,140,3,(x,y,z)=>land(x,z,y)?{x,y:y-0.2,z,ry:rnd()*TAU,s:rr(1.2,2.2)}:null)));
    const pine=coneTreeGeo(0x2d5a32); G.add(instanced(pine,vcMat,areaScatter(260,10,(x,y,z)=>y>4?{x,y:y-0.3,z,ry:rnd()*TAU,s:rr(1.5,3)}:null)));
    const rg=rockGeo(3); const rm=new THREE.MeshStandardMaterial({color:0x6d655c,roughness:0.95,flatShading:true});
    G.add(instanced(rg,rm,areaScatter(40,20,(x,y,z)=>y<-4&&y>-24?{x,y:-4,z,ry:rnd()*TAU,s:[rr(4,10),rr(6,22),rr(4,10)]}:null),true));
    G.add(instanced(rg,rm,scatter(80,2,50,2,(x,y,z)=>({x,y,z,ry:rnd()*TAU,s:rr(0.8,3)}))));
    // gallery tunnel (open to the ocean side)
    (def.tunnels||[]).forEach(t=>{ const inc=(i,j)=>P.tunnel[i]&&P.tunnel[j]; const roofY=7.2;
      const cm=new THREE.MeshStandardMaterial({color:0xb9b2a4,roughness:0.9,side:THREE.DoubleSide});
      const roof=H.ribbon(inc,i=>-P.wl[i]-0.6,i=>P.wr[i]+0.6,roofY,roofY,0,1,6); const roofTop=H.ribbon(inc,i=>-P.wl[i]-0.6,i=>P.wr[i]+0.6,roofY+0.8,roofY+0.8,0,1,6);
      const inner=H.ribbon(inc,i=>P.wr[i]+0.2,i=>P.wr[i]+0.2,-0.5,roofY,0,1,6);
      const m=new THREE.Mesh(mergeGeos([roof,roofTop,inner]),cm); m.castShadow=true; m.receiveShadow=true; G.add(m);
      const cols=[]; for(let k=0;k<t.n;k+=3){ const i=(t.i0+k)%P.N; const p=ptAt(i,-P.wl[i]-0.3,0); cols.push({x:p[0],y:p[1]-0.5,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i]),s:[0.9,roofY+0.5,1.4]}); }
      const cg=new THREE.BoxGeometry(1,1,1); cg.translate(0,0.5,0); G.add(instanced(cg,cm,cols,true,true));
      const lights=[]; for(let k=2;k<t.n;k+=4){ const i=(t.i0+k)%P.N; const p=ptAt(i,0,roofY-0.1); lights.push({x:p[0],y:p[1],z:p[2],ry:Math.atan2(P.tx[i],P.tz[i]),s:[1.5,0.1,2]}); }
      G.add(instanced(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffe7b0}),lights,false)); });
    // lighthouse landmark
    { const i=P.cpIdx[8]; const e=P.wl[i]+26; const x=P.x[i]-P.rx[i]*e, z=P.z[i]-P.rz[i]*e, y=Math.max(heightAt(x,z),P.y[i]-4); const grp=new THREE.Group(); grp.position.set(x,y,z); G.add(grp);
      const base=new THREE.Mesh(new THREE.CylinderGeometry(6,7,4,20),stdMat(0x9a8f80)); base.position.y=-1; grp.add(base);
      for(let k=0;k<5;k++){ const s=new THREE.Mesh(new THREE.CylinderGeometry(2.6-k*0.25,2.85-k*0.25,4.4,18),stdMat(k%2?0xd8262b:0xf4f4f4)); s.position.y=2.2+k*4.4; s.castShadow=true; grp.add(s); }
      const lan=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,2.4,12),new THREE.MeshBasicMaterial({color:0xfff2b0})); lan.position.y=24.4; grp.add(lan);
      const cap=new THREE.Mesh(new THREE.ConeGeometry(2.2,2.2,12),stdMat(0x1f1f1f)); cap.position.y=26.7; grp.add(cap);
      const gl=glowSprite(0xfff0b0,26,0.7); gl.position.y=24.4; grp.add(gl);
      const beamG=new THREE.ConeGeometry(4,60,16,1,true); beamG.translate(0,-30,0); beamG.rotateZ(Math.PI/2);
      const beam=new THREE.Mesh(beamG,new THREE.MeshBasicMaterial({color:0xfff2c0,transparent:true,opacity:0.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); beam.position.y=24.4; grp.add(beam);
      W.updaters.push((dt,t)=>beam.rotation.y=t*0.8); }
    // clifftop villas (Mediterranean village feel)
    const vf=new THREE.MeshStandardMaterial({map:facadeTex('villa'),roughness:0.9}); const rfm=stdMat(0xb5532e);
    const vl=scatter(28,10,60,5,(x,y,z,i,sd)=>{ if(y<1) return null; const ang=Math.atan2(P.tx[i],P.tz[i]); const w=rr(9,14),d=rr(8,11),h=rr(5,8); if(!footprintClear(x,z,ang,w,d,4)) return null; return {x,y:y-0.3,z,ry:ang,s:[w,h,d],c:pick([0xffffff,0xf7e7cf,0xf2d6c0])}; });
    const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0); G.add(instanced(bg,[vf,vf,rfm,rfm,vf,vf],vl,true,true));
    const rg2=new THREE.ConeGeometry(0.75,0.35,4); rg2.rotateY(Math.PI/4); rg2.translate(0,0.17,0); G.add(instanced(rg2,rfm,vl.map(v=>({x:v.x,y:v.y+v.s[1],z:v.z,ry:v.ry,s:[v.s[0]*0.95*1.41,v.s[1]*0.9,v.s[2]*0.95*1.41]})),true));
    // sailboats
    for(let k=0;k<5;k++){ const b=new THREE.Group(); const x=W.nat.cx-rr(350,900), z=W.nat.cz+rr(-600,600); b.position.set(x,-3,z); const hull=new THREE.Mesh(new THREE.BoxGeometry(2,1,7),stdMat(0xffffff)); b.add(hull);
      const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute([0,1,-2,0,11,0,0,1,2.8],3)); sg.computeVertexNormals(); const sail=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:0xf8f4ec,side:THREE.DoubleSide})); b.add(sail); b.rotation.y=rnd()*TAU; G.add(b); }
    billboard(P.cpIdx[13],1,8,[{text:'PACIFICA',font:'italic 150px Yellowtail',color:'#ff7a1f',y:0.42},{text:'COAST HIGHWAY',font:'bold 80px "Chakra Petch"',color:'#fff',y:0.76}],'#10304f');
  }
  if(def.theme==='night'){
    W.rain=true;
    const wf=new THREE.MeshStandardMaterial({map:facadeTex('warehouse'),emissiveMap:facadeTex('warehouseE'),emissive:0xffffff,emissiveIntensity:0.9,roughness:0.7,metalness:0.4}); const wr=stdMat(0x22242c,{metalness:0.5});
    const wh=scatter(70,10,70,6,(x,y,z,i,sd)=>{ const ang=Math.atan2(P.tx[i],P.tz[i]); const w=rr(20,38),d=rr(16,28); if(!freeOfProps(x,z,Math.max(w,d)/2)) return null; const h=rr(9,18); if(!footprintClear(x,z,ang,w,d,5)) return null; return {x,y:y-0.2,z,ry:ang,s:[w,h,d],c:pick([0xffffff,0xcfd6ff,0xffd9e8,0xd0fff5])}; });
    const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0); G.add(instanced(bg,[wf,wf,wr,wr,wf,wf],wh,true,true));
    // neon signs on warehouse fronts
    const words=[["RYDEN'S",'#ff2e97'],['OPEN 24/7','#22e4ff'],['FOUNDRY 47','#ffb000'],['PLASMA','#b65cff'],['GLAZE EM','#ff4fb0'],['NIGHT SHIFT','#22e4ff']];
    wh.slice(0,Math.min(18,wh.length)).forEach((b,k)=>{ const [txt,col]=words[k%words.length]; const tex=textPanelTex([{text:txt,font:'italic bold 150px "Racing Sans One",Impact',color:col,glow:col,y:0.55}],{w:1024,h:256,bg:'rgba(0,0,0,0)'});
      const m=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(16,b.s[0]*0.7),4),new THREE.MeshBasicMaterial({map:tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
      const fx=Math.sin(b.ry+Math.PI/2), fz=Math.cos(b.ry+Math.PI/2); const toRoad=hash(b.x,b.z,4); const sign=toRoad.i>=0&&((P.x[toRoad.i]-b.x)*fx+(P.z[toRoad.i]-b.z)*fz)>0?1:-1;
      m.position.set(b.x+fx*sign*(b.s[0]/2+0.1),b.y+b.s[1]*0.7,b.z+fz*sign*(b.s[0]/2+0.1)); m.rotation.y=b.ry+Math.PI/2+(sign<0?Math.PI:0); G.add(m); });
    // smokestacks
    W.smoke=[]; const stackM=stdMat(0x5a5a62,{metalness:0.4}); const bandM=stdMat(0xc0392b);
    areaScatter(10,40,(x,y,z)=>{ const h=rr(35,60); const s=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.8,h,14),stackM); s.position.set(x,y+h/2,z); s.castShadow=true; G.add(s);
      const b=new THREE.Mesh(new THREE.CylinderGeometry(1.85,1.95,2.5,14),bandM); b.position.set(x,y+h-3,z); G.add(b); const l=glowSprite(0xff2020,5,0.9); l.position.set(x,y+h+0.5,z); G.add(l); W.updaters.push((dt,t)=>l.material.opacity=(Math.sin(t*3+x)>0)?0.95:0.15);
      W.smoke.push([x,y+h+1,z]); return {}; });
    // blast furnace landmark
    { const i=P.cpIdx[7]; const e=P.wr[i]+26; const x=P.x[i]+P.rx[i]*e, z=P.z[i]+P.rz[i]*e, y=heightAt(x,z); const grp=new THREE.Group(); grp.position.set(x,y,z); G.add(grp);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(7,9,30,20),stdMat(0x3b3b44,{metalness:0.6,roughness:0.5})); body.position.y=15; body.castShadow=true; grp.add(body);
      const top=new THREE.Mesh(new THREE.ConeGeometry(7,8,20),stdMat(0x2e2e36,{metalness:0.6})); top.position.y=34; grp.add(top);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(9.2,0.6,8,32),new THREE.MeshBasicMaterial({color:0xff7a18})); ring.rotation.x=Math.PI/2; ring.position.y=4; grp.add(ring);
      const mouth=new THREE.Mesh(new THREE.BoxGeometry(6,5,0.5),new THREE.MeshBasicMaterial({color:0xffa030})); mouth.position.set(0,3,-8.6); grp.add(mouth);
      const gl=glowSprite(0xff7a18,40,0.8); gl.position.y=6; grp.add(gl); W.updaters.push((dt,t)=>{ gl.material.opacity=0.6+0.2*Math.sin(t*5)+0.1*Math.sin(t*13); });
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,40,10),stdMat(0x55555e,{metalness:0.5})); pipe.rotation.z=Math.PI/2.6; pipe.position.set(-16,26,0); grp.add(pipe); W.smoke.push([x,y+38,z]); }
    // harbor crane spanning the track
    { const i=P.idxAt(13,0.6); const e=Math.max(P.wl[i],P.wr[i])+4; const grp=new THREE.Group(); grp.position.set(P.x[i],P.y[i],P.z[i]); grp.rotation.y=Math.atan2(P.tx[i],P.tz[i]); G.add(grp);
      const ym=stdMat(0xf2b705,{metalness:0.4,roughness:0.5});
      [-1,1].forEach(s=>[-5,5].forEach(zz=>{ const l=new THREE.Mesh(new THREE.BoxGeometry(1,24,1),ym); l.position.set(s*e,12,zz); l.castShadow=true; grp.add(l); }));
      const beam=new THREE.Mesh(new THREE.BoxGeometry(e*2+2,2.2,12),ym); beam.position.y=24; beam.castShadow=true; grp.add(beam);
      const boom=new THREE.Mesh(new THREE.BoxGeometry(2,2,70),ym); boom.position.set(0,30,-10); grp.add(boom);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(4,3,4),stdMat(0x222222)); cab.position.set(e-2,21.5,0); grp.add(cab);
      [-e,e].forEach(px=>{ const l=glowSprite(0xff3030,4); l.position.set(px,25.5,0); grp.add(l); }); }
    // street lamps with light pools
    const lamps=[],pools=[]; for(let i=0;i<P.N;i+=20){ if(P.gap[i]) continue; const sd=(Math.floor(i/20)%2)?1:-1; const e=(sd<0?P.wl[i]:P.wr[i])+0.8; const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; lamps.push({x,y:P.y[i]-0.5,z,ry:Math.atan2(-P.rx[i]*sd,-P.rz[i]*sd)});
      const q=ptAt(i,sd*(e-4),0.07); pools.push({x:q[0],y:q[1],z:q[2],rx:-Math.PI/2,s:14}); }
    const lp=new THREE.CylinderGeometry(0.12,0.16,9,6); lp.translate(0,4.5,0); const la=new THREE.BoxGeometry(0.25,0.25,3.2); la.translate(0,9,1.5); G.add(instanced(mergeGeos([lp,la]),stdMat(0x2a2a30,{metalness:0.7}),lamps));
    const head=new THREE.BoxGeometry(0.9,0.12,0.5); head.translate(0,8.85,3); G.add(instanced(head,new THREE.MeshBasicMaterial({color:0xffc98a}),lamps,false));
    G.add(instanced(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:glowTex(),color:0xff9c50,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending,depthWrite:false}),pools,false));
    // canal water
    W.nat.channels.forEach(c=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(22,840),new THREE.MeshStandardMaterial({color:0x0a1a2a,roughness:0.1,metalness:0.6,emissive:0x0a1030})); m.rotation.x=-Math.PI/2; m.rotation.z=Math.atan2(c.dx,c.dz); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,Math.atan2(c.dx,c.dz),0); m.position.set(c.x,c.y-7,c.z); G.add(m); });
    // industrial pipes along a section
    const pipes=[]; for(let i=P.cpIdx[14];i<P.cpIdx[19];i+=5){ const e=P.wr[i]+3; const p=ptAt(i,e,0); pipes.push({x:p[0],y:p[1]+2.4,z:p[2],ry:Math.atan2(P.tx[i],P.tz[i]),rx:Math.PI/2,s:[1,11,1]}); }
    G.add(instanced(new THREE.CylinderGeometry(0.6,0.6,1,10),stdMat(0x6c6f78,{metalness:0.7,roughness:0.35}),pipes));
    // skyline ring
    const tw=facadeTex('tower'); const towers=[]; for(let k=0;k<70;k++){ const a=k/70*TAU+rr(-0.03,0.03); const r=rr(700,900); towers.push({x:W.nat.cx+Math.sin(a)*r,y:0,z:W.nat.cz+Math.cos(a)*r,ry:rnd(),s:[rr(25,50),rr(50,200),rr(25,50)]}); }
    const tg=new THREE.BoxGeometry(1,1,1); tg.translate(0,0.5,0); tw.repeat.set(2,3); G.add(instanced(tg,new THREE.MeshStandardMaterial({color:0x14142a,emissive:0xffffff,emissiveMap:tw,emissiveIntensity:0.8,roughness:0.6}),towers,false));
    billboard(P.cpIdx[3],-1,8,[{text:'NEON FOUNDRY',font:'italic bold 130px "Racing Sans One",Impact',color:'#ff2e97',glow:'#ff2e97',y:0.4},{text:'NIGHTS',font:'bold 110px "Racing Sans One"',color:'#22e4ff',glow:'#22e4ff',y:0.75}],'#0d0620');
  }
}

// ===== HONKY TONK HIGHWAY: country scenery =====
function buildCountryScenery(W,def,P,Q,H,K){
  const G=W.group, {heightAt,clearOfRoad}=H, {scatter,areaScatter,footprintClear,stdMat,vcMat,freeOfProps}=K, D=Q.density;
  const blocked=[]; const free=(x,z,r)=>freeOfProps(x,z,r)&&!blocked.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+r);
  const nat=W.nat;

  // ---------- creek ----------
  if(def.creek){ const ck=def.creek; const pts=[]; for(let k=0;k<ck.length-1;k++){ const [ax,az]=ck[k],[bx,bz]=ck[k+1]; const n=Math.ceil(Math.hypot(bx-ax,bz-az)/6); for(let q=0;q<n;q++) pts.push([lerp(ax,bx,q/n),lerp(az,bz,q/n)]); } pts.push(ck[ck.length-1]);
    const pos=[],uv=[],idx=[]; const Y=-4.6, hw=9;
    pts.forEach((p,k)=>{ const a=pts[Math.max(0,k-1)], b=pts[Math.min(pts.length-1,k+1)]; let tx=b[0]-a[0],tz=b[1]-a[1]; const l=Math.hypot(tx,tz)||1; tx/=l; tz/=l; const rx=-tz,rz=tx;
      pos.push(p[0]+rx*hw,Y,p[1]+rz*hw, p[0]-rx*hw,Y,p[1]-rz*hw); uv.push(0,k*0.25,1,k*0.25); if(k){ const o=(k-1)*2; idx.push(o,o+1,o+2,o+1,o+3,o+2); } });
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const wt=canvasTex(128,256,(c,w,h)=>{ const gr=c.createLinearGradient(0,0,w,0); gr.addColorStop(0,'#3d6b5a'); gr.addColorStop(0.5,'#5a9ab0'); gr.addColorStop(1,'#3d6b5a'); c.fillStyle=gr; c.fillRect(0,0,w,h); for(let i=0;i<80;i++){ c.fillStyle='rgba(255,255,255,0.18)'; c.fillRect(Math.random()*w,Math.random()*h,8+Math.random()*20,1.5); } },{repeat:true});
    const wm=new THREE.MeshStandardMaterial({map:wt,roughness:0.15,metalness:0.2,transparent:true,opacity:0.92,side:THREE.DoubleSide}); const water=new THREE.Mesh(g,wm); water.receiveShadow=true; G.add(water);
    W.updaters.push((dt,t)=>{ wt.offset.y=-t*0.25; });
    // river rocks along the banks
    const rocks=[]; pts.forEach((p,k)=>{ if(k%2) return; for(const sd of [-1,1]){ const x=p[0]+rr(-3,3)+sd*rr(8,12), z=p[1]+rr(-3,3); if(!clearOfRoad(x,z,3)) continue; rocks.push({x,y:heightAt(x,z)-0.3,z,ry:rnd()*TAU,s:[rr(0.8,2),rr(0.5,1.2),rr(0.8,2)],c:0x8a8278}); } });
    G.add(instanced(new THREE.DodecahedronGeometry(1,0),stdMat(0xffffff),rocks,true,true));
  }

  // ---------- covered bridge over the creek (tunnel section) ----------
  (def.tunnels||[]).forEach(()=>{ const inc=(i,j)=>P.tunnel[i]&&P.tunnel[j];
    const wood=new THREE.MeshStandardMaterial({map:canvasTex(256,128,(c,w,h)=>{ noiseFill(c,w,h,'#9a2a1e',18); c.fillStyle='rgba(40,10,5,0.5)'; for(let x=0;x<w;x+=16) c.fillRect(x,0,2,h); },{repeat:true}),roughness:0.85,side:THREE.DoubleSide});
    const roofM=new THREE.MeshStandardMaterial({color:0x3a302a,roughness:0.9,side:THREE.DoubleSide});
    const wl=H.ribbon(inc,i=>-P.wl[i]-0.3,i=>-P.wl[i]-0.3,-0.3,5.2,0,1,4), wr=H.ribbon(inc,i=>P.wr[i]+0.3,i=>P.wr[i]+0.3,-0.3,5.2,0,1,4);
    const m1=new THREE.Mesh(mergeGeos([wl,wr]),wood); m1.castShadow=true; G.add(m1);
    const rl=H.ribbon(inc,i=>-P.wl[i]-1.2,i=>0,5.0,8.2,0,1,6), rrg=H.ribbon(inc,i=>0,i=>P.wr[i]+1.2,8.2,5.0,0,1,6);
    const m2=new THREE.Mesh(mergeGeos([rl,rrg]),roofM); m2.castShadow=true; G.add(m2);
    // deck edge beams + stone abutments at both ends
    const idxs=[]; for(let i=0;i<P.N;i++) if(P.tunnel[i]) idxs.push(i);
    [idxs[0],idxs[idxs.length-1]].forEach(i=>{ if(i===undefined) return; for(const sd of [-1,1]){ const e=(sd<0?P.wl[i]:P.wr[i])+0.6; const pier=new THREE.Mesh(new THREE.BoxGeometry(1.6,9,2.2),stdMat(0x8d8578)); pier.position.set(P.x[i]+P.rx[i]*e*sd,P.y[i]-3.8,P.z[i]+P.rz[i]*e*sd); pier.rotation.y=Math.atan2(P.tx[i],P.tz[i]); pier.castShadow=true; G.add(pier); } });
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(7,1.3),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'HONKY TONK CROSSING',font:'bold 64px "Racing Sans One", Impact',color:'#f3e2b8',y:0.55}],{w:1024,h:190,bg:'#3a1a10'})}));
    const i0=idxs[0]; if(i0!==undefined){ sign.position.set(P.x[i0]-P.tx[i0]*0.4,P.y[i0]+6.3,P.z[i0]-P.tz[i0]*0.4); sign.rotation.y=Math.atan2(-P.tx[i0],-P.tz[i0]); G.add(sign); }
  });

  // ---------- THE RED SOLO CUP MONUMENT (the centrepiece) ----------
  if(def.monument && typeof CAR_GLTF!=='undefined' && CAR_GLTF.solocup){
    const {x,z}=def.monument; const R=22; const base=Math.max(nat(x,z),0); const gy=base+3.2;
    const mound=new THREE.Mesh(new THREE.CylinderGeometry(R+3,R+16,3.4,48),new THREE.MeshStandardMaterial({color:0x5f7f34,roughness:1})); mound.position.set(x,base+1.4,z); mound.receiveShadow=true; G.add(mound);
    blocked.push({x,z,r:R+10});
    const stone=new THREE.MeshStandardMaterial({map:canvasTex(256,256,(c,w,h)=>{ noiseFill(c,w,h,'#b9ad98',20); c.strokeStyle='rgba(60,50,40,0.35)'; c.lineWidth=2; for(let y=0;y<h;y+=32){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); for(let xx=(y/32%2)*32;xx<w;xx+=64){ c.beginPath(); c.moveTo(xx,y); c.lineTo(xx,y+32); c.stroke(); } } },{repeat:true}),roughness:0.9});
    stone.map.repeat.set(6,1);
    const plaza=new THREE.Mesh(new THREE.CylinderGeometry(R,R+2,1.6,48),stone); plaza.position.set(x,gy+0.2,z); plaza.receiveShadow=true; plaza.castShadow=true; G.add(plaza);
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(R*0.55,R*0.6,1.4,40),stone); ring.position.set(x,gy+1.6,z); ring.castShadow=true; G.add(ring);
    const red=new THREE.MeshStandardMaterial({color:0xc8201e,roughness:0.6}); const band=new THREE.Mesh(new THREE.TorusGeometry(R*0.57,0.18,8,64),red); band.rotation.x=Math.PI/2; band.position.set(x,gy+2.3,z); G.add(band);
    // the cup itself, towering over the infield
    const cup=makeProp('solocup'); cup.position.set(x,gy+2.3,z); const toStart=Math.atan2(0-x,20-z); cup.rotation.y=toStart; G.add(cup);
    // bronze plaque facing the start straight
    const pl=new THREE.Mesh(new THREE.BoxGeometry(6.4,1.8,0.3),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'RED SOLO CUP',font:'bold 88px "Racing Sans One", Impact',color:'#ffe2a0',y:0.36},{text:'IN LOVING MEMORY OF TOBY',font:'bold 46px "Chakra Petch", sans-serif',color:'#f5d99a',y:0.74}],{w:1024,h:290,bg:'#5a3a14'}),metalness:0.5,roughness:0.45}));
    const ang=toStart; pl.position.set(x+Math.sin(ang)*(R*0.6+0.2),gy+1.7,z+Math.cos(ang)*(R*0.6+0.2)); pl.rotation.y=ang; G.add(pl);
    // floodlight towers + light beams + flags + string lights
    const poleM=stdMat(0x2a2a2e,{metalness:0.6,roughness:0.4}); const beamM=new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:0.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    const beams=[]; const tops=[];
    for(let k=0;k<6;k++){ const a=k/6*TAU+0.3, px=x+Math.cos(a)*(R-1.5), pz=z+Math.sin(a)*(R-1.5);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.18,0.26,11,8),poleM); pole.position.set(px,gy+6.5,pz); pole.castShadow=true; G.add(pole); tops.push([px,gy+12,pz]);
      const lamp=glowSprite(0xfff2c0,3.2,0.9); lamp.position.set(px,gy+12.1,pz); G.add(lamp);
      const bg=new THREE.ConeGeometry(4.5,15,20,1,true); bg.translate(0,-7.5,0); const b=new THREE.Mesh(bg,beamM); b.position.set(px,gy+12,pz); b.lookAt(x,gy+10,z); b.rotateX(Math.PI/2); G.add(b); beams.push(b); }
    for(let k=0;k<4;k++){ const a=k/4*TAU+1.0, px=x+Math.cos(a)*(R+3), pz=z+Math.sin(a)*(R+3); const fp=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,12,6),stdMat(0xdddddd,{metalness:0.7})); fp.position.set(px,gy+6,pz); G.add(fp);
      const fg=new THREE.PlaneGeometry(3.4,2,10,1); fg.translate(1.7,0,0); const fl=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({map:canvasTex(128,76,(c,w,h)=>{ for(let s=0;s<7;s++){ c.fillStyle=s%2?'#f5f0e6':'#c8201e'; c.fillRect(0,s*h/7,w,h/7+1);} c.fillStyle='#233a78'; c.fillRect(0,0,w*0.42,h*0.54); c.fillStyle='#fff'; for(let i=0;i<5;i++) for(let j=0;j<4;j++) c.fillRect(5+i*10,4+j*10,3,3); }),side:THREE.DoubleSide,roughness:0.8}));
      fl.position.set(px,gy+11,pz); G.add(fl); W.updaters.push((dt,t)=>{ const p=fg.attributes.position; for(let i=0;i<p.count;i++){ const X=p.getX(i); p.setZ(i,Math.sin(X*2.2-t*5+k)*0.18*(X/3.4)); } p.needsUpdate=true; }); }
    // string lights between the floodlight poles
    const bulbs=[]; for(let k=0;k<tops.length;k++){ const a=tops[k], b=tops[(k+1)%tops.length]; for(let q=1;q<14;q++){ const t=q/14; bulbs.push({x:lerp(a[0],b[0],t),y:lerp(a[1],b[1],t)-2.2*Math.sin(t*Math.PI)-0.4,z:lerp(a[2],b[2],t),s:0.16,c:[0xffd27a,0xff6a4a,0x8affc8,0xffffff][q%4]}); } }
    G.add(instanced(new THREE.SphereGeometry(1,6,4),new THREE.MeshBasicMaterial({color:0xffffff}),bulbs,false));
    // hay-bale seating ring and a few pickup-bed style crowd blocks
    const hay=[]; for(let k=0;k<22;k++){ const a=k/22*TAU; hay.push({x:x+Math.cos(a)*(R+6.5),y:heightAt(x+Math.cos(a)*(R+6.5),z+Math.sin(a)*(R+6.5))+0.6,z:z+Math.sin(a)*(R+6.5),rz:Math.PI/2,ry:a,s:[0.75,1.4,0.75],c:0xd8b35a}); }
    G.add(instanced(new THREE.CylinderGeometry(1,1,1,14),stdMat(0xffffff,{roughness:1}),hay,true,true));
    W.updaters.push((dt,t)=>{ beams.forEach((b,k)=>{ b.material.opacity=0.04+0.02*Math.sin(t*1.3+k); }); });
    W.monument={x,y:gy,z};
  }

  // ---------- farm buildings ----------
  const barnWood=canvasTex(256,256,(c,w,h)=>{ noiseFill(c,w,h,'#a3261c',16); c.fillStyle='rgba(50,10,5,0.45)'; for(let x=0;x<w;x+=12) c.fillRect(x,0,2,h); },{repeat:true});
  const barnM=new THREE.MeshStandardMaterial({map:barnWood,roughness:0.85}), trimM=stdMat(0xf2ede0), roofM=stdMat(0x3b3b40,{roughness:0.7,metalness:0.3});
  const makeBarn=(s)=>{ const g=new THREE.Group(); const w=12*s,d=18*s,h=7*s;
    const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),barnM); body.position.y=h/2; g.add(body);
    const sh=new THREE.Shape(); sh.moveTo(-w/2-0.4,0); sh.lineTo(-w*0.32,h*0.45); sh.lineTo(0,h*0.62); sh.lineTo(w*0.32,h*0.45); sh.lineTo(w/2+0.4,0); sh.closePath();
    const rg=new THREE.ExtrudeGeometry(sh,{depth:d+0.8,bevelEnabled:false}); rg.translate(0,h,-(d+0.8)/2); const roof=new THREE.Mesh(rg,roofM); g.add(roof);
    const gab=new THREE.Shape(); gab.moveTo(-w/2,0); gab.lineTo(-w*0.32,h*0.45); gab.lineTo(0,h*0.62); gab.lineTo(w*0.32,h*0.45); gab.lineTo(w/2,0); gab.closePath(); const gg=new THREE.ShapeGeometry(gab); gg.translate(0,h,d/2+0.01);
    g.add(new THREE.Mesh(gg,barnM)); const gb=gg.clone(); gb.rotateY(Math.PI); g.add(new THREE.Mesh(gb,barnM));
    const door=new THREE.Mesh(new THREE.PlaneGeometry(w*0.42,h*0.72),new THREE.MeshStandardMaterial({map:canvasTex(128,128,(c,W2,H2)=>{ c.fillStyle='#8f1f16'; c.fillRect(0,0,W2,H2); c.strokeStyle='#f2ede0'; c.lineWidth=9; c.strokeRect(5,5,W2-10,H2-10); c.beginPath(); c.moveTo(5,5); c.lineTo(W2-5,H2-5); c.moveTo(W2-5,5); c.lineTo(5,H2-5); c.stroke(); })}));
    door.position.set(0,h*0.36,d/2+0.02); g.add(door); const loft=new THREE.Mesh(new THREE.PlaneGeometry(w*0.18,h*0.22),stdMat(0x1a1210)); loft.position.set(0,h*1.18,d/2+0.03); g.add(loft);
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); return {g,w,d}; };
  const siloM=stdMat(0xc9ccd0,{metalness:0.55,roughness:0.35}), domeM=stdMat(0xa8abb0,{metalness:0.6,roughness:0.3});
  const makeSilo=(h)=>{ const g=new THREE.Group(); const r=2.6; const c=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),siloM); c.position.y=h/2; g.add(c); for(let k=1;k<h/2.2;k++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(r+0.03,0.05,4,20),domeM); ring.rotation.x=Math.PI/2; ring.position.y=k*2.2; g.add(ring); } const dm=new THREE.Mesh(new THREE.SphereGeometry(r,20,10,0,TAU,0,Math.PI/2),domeM); dm.position.y=h; g.add(dm); g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; };
  const farms=[]; let tries=0;
  while(farms.length<Math.round(5*Math.max(0.6,D)) && tries<400){ tries++; const i=Math.floor(rnd()*P.N), sd=rnd()<0.5?-1:1; const e=(sd<0?P.wl[i]:P.wr[i])+rr(30,70); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; const ang=Math.atan2(-P.rx[i]*sd,-P.rz[i]*sd);
    if(!footprintClear(x,z,ang,30,30,6) || !free(x,z,18) || farms.some(f=>Math.hypot(f.x-x,f.z-z)<90)) continue; farms.push({x,z,ang}); }
  farms.forEach((f,k)=>{ const b=makeBarn(rr(0.9,1.15)); const y=heightAt(f.x,f.z)-0.1; b.g.position.set(f.x,y,f.z); b.g.rotation.y=f.ang; G.add(b.g);
    const ca=Math.cos(f.ang), sa=Math.sin(f.ang); for(let q=0;q<(k%2?2:1);q++){ const s=makeSilo(rr(12,17)); const ox=b.w/2+4+q*6; s.position.set(f.x+ca*ox,heightAt(f.x+ca*ox,f.z-sa*ox),f.z-sa*ox); G.add(s); }
    blocked.push({x:f.x,z:f.z,r:22}); });

  // ---------- windmills (animated) ----------
  const mills=[]; tries=0;
  while(mills.length<3 && tries<300){ tries++; const i=Math.floor(rnd()*P.N), sd=rnd()<0.5?-1:1; const e=(sd<0?P.wl[i]:P.wr[i])+rr(18,40); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; if(!clearOfRoad(x,z,8)||!free(x,z,6)||mills.some(m=>Math.hypot(m.x-x,m.z-z)<150)) continue;
    const y=heightAt(x,z); const g=new THREE.Group(); g.position.set(x,y,z); const steel=stdMat(0x8a8d90,{metalness:0.6,roughness:0.4});
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,13,5),steel); leg.position.set(a*1.1,6.3,b*1.1); leg.rotation.set(b*0.08,0,-a*0.08); g.add(leg); }
    const hub=new THREE.Group(); hub.position.set(0,13,0); g.add(hub); const rot=new THREE.Group(); hub.add(rot);
    for(let k=0;k<18;k++){ const bl=new THREE.Mesh(new THREE.BoxGeometry(0.35,2.6,0.05),stdMat(0xd8d8d0,{metalness:0.4})); bl.position.set(Math.cos(k/18*TAU)*1.6,Math.sin(k/18*TAU)*1.6,0); bl.rotation.z=k/18*TAU-Math.PI/2; rot.add(bl); }
    const vane=new THREE.Mesh(new THREE.BoxGeometry(0.05,1.4,2.6),stdMat(0xc8201e)); vane.position.set(0,0,-2); hub.add(vane); hub.rotation.y=rnd()*TAU;
    g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); G.add(g); const sp=rr(1.5,2.5); W.updaters.push((dt)=>{ rot.rotation.z+=dt*sp; }); mills.push({x,z}); blocked.push({x,z,r:4}); }

  // ---------- oak trees, hay bales, fields, fences ----------
  const trunk=new THREE.CylinderGeometry(0.35,0.55,4,7); trunk.translate(0,2,0);
  const canopy=mergeGeos([0,1,2,3].map(k=>{ const s=new THREE.IcosahedronGeometry(k?2.2:2.8,1); s.translate(k?Math.cos(k*2.1)*1.8:0,k?4.8+rr(-0.3,0.6):5.6,k?Math.sin(k*2.1)*1.8:0); return tintGeo(s,0xffffff); }));
  const oaks=scatter(160,6,120,5,(x,y,z)=>free(x,z,3)?{x,y,z,ry:rnd()*TAU,s:rr(0.8,1.5)}:null).concat(areaScatter(220,40,(x,y,z)=>free(x,z,3)?{x,y,z,ry:rnd()*TAU,s:rr(1,1.9)}:null));
  G.add(instanced(trunk,stdMat(0x5a4030),oaks,true)); G.add(instanced(canopy,stdMat(0xffffff),oaks.map(o=>Object.assign({},o,{c:[0x4f7a2e,0x5f8a34,0x6b8f3a,0x3f6a28][Math.floor(rnd()*4)]})),true));
  const bales=scatter(70,5,60,4,(x,y,z)=>free(x,z,2)?{x,y:y+0.75,z,rz:Math.PI/2,ry:rnd()*TAU,s:[0.75,1.5,0.75],c:0xd8b35a}:null);
  G.add(instanced(new THREE.CylinderGeometry(1,1,1,14),stdMat(0xffffff,{roughness:1}),bales,true,true));
  // crop fields: striped ground patches
  const fieldTex=canvasTex(256,256,(c,w,h)=>{ c.fillStyle='#6d5a2c'; c.fillRect(0,0,w,h); for(let x=0;x<w;x+=16){ c.fillStyle='#7fa33a'; c.fillRect(x+3,0,9,h); c.fillStyle='rgba(200,220,120,0.4)'; c.fillRect(x+5,0,2,h); } },{repeat:true});
  const fieldM=new THREE.MeshStandardMaterial({map:fieldTex,roughness:1,polygonOffset:true,polygonOffsetFactor:-3});
  let nf=0; tries=0; while(nf<Math.round(10*D) && tries<400){ tries++; const i=Math.floor(rnd()*P.N), sd=rnd()<0.5?-1:1; const e=(sd<0?P.wl[i]:P.wr[i])+rr(20,90); const x=P.x[i]+P.rx[i]*e*sd, z=P.z[i]+P.rz[i]*e*sd; const w=rr(40,80), d=rr(30,60), a=Math.atan2(P.tx[i],P.tz[i]);
    if(!footprintClear(x,z,a,w,d,4)||!free(x,z,Math.max(w,d)/2)) continue; if(W.nat.creekD && W.nat.creekD(x,z)<Math.max(w,d)/2+12) continue;
    const seg=10, g=new THREE.PlaneGeometry(w,d,seg,seg); g.rotateX(-Math.PI/2); g.rotateY(a); const p=g.attributes.position; for(let k=0;k<p.count;k++){ p.setY(k,heightAt(x+p.getX(k),z+p.getZ(k))+0.08); } g.computeVertexNormals();
    const tx=fieldTex.clone(); tx.needsUpdate=true; tx.repeat.set(w/16,d/16); const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:tx,roughness:1,polygonOffset:true,polygonOffsetFactor:-3})); m.position.set(x,0,z); m.receiveShadow=true; G.add(m); nf++; }
  // ---------- honky-tonk bar + water tower near the start ----------
  const i0=Math.round(P.N*0.02), sdB=1, eB=P.wr[i0]+26; const bx=P.x[i0]+P.rx[i0]*eB*sdB, bz=P.z[i0]+P.rz[i0]*eB*sdB; const bang=Math.atan2(-P.rx[i0]*sdB,-P.rz[i0]*sdB);
  if(footprintClear(bx,bz,bang,20,14,4)&&free(bx,bz,12)){ const g=new THREE.Group(); g.position.set(bx,heightAt(bx,bz)-0.1,bz); g.rotation.y=bang;
    const plank=new THREE.MeshStandardMaterial({map:canvasTex(256,128,(c,w,h)=>{ noiseFill(c,w,h,'#6b4a2e',20); c.fillStyle='rgba(30,15,5,0.5)'; for(let y=0;y<h;y+=10) c.fillRect(0,y,w,1.5); },{repeat:true}),roughness:0.9});
    const body=new THREE.Mesh(new THREE.BoxGeometry(20,6,14),plank); body.position.y=3; g.add(body); const rf=new THREE.Mesh(new THREE.BoxGeometry(21,0.5,15),roofM); rf.position.y=6.2; g.add(rf);
    const porch=new THREE.Mesh(new THREE.BoxGeometry(20,0.3,3),plank); porch.position.set(0,3.6,8.2); g.add(porch); for(const px of [-9.5,-3,3,9.5]){ const post=new THREE.Mesh(new THREE.BoxGeometry(0.3,3.6,0.3),plank); post.position.set(px,1.8,9.5); g.add(post); }
    const neon=new THREE.Mesh(new THREE.PlaneGeometry(12,2.6),new THREE.MeshBasicMaterial({map:textPanelTex([{text:'HONKY TONK',font:'italic bold 120px Yellowtail, cursive',color:'#ff6a3a',glow:'#ff2e2e',y:0.55}],{w:1024,h:230,bg:'rgba(0,0,0,0)'}),transparent:true}));
    neon.position.set(0,7.9,7.1); g.add(neon);
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); G.add(g); blocked.push({x:bx,z:bz,r:13});
    // water tower
    const wx=bx+Math.cos(bang)*18, wz=bz-Math.sin(bang)*18; const tw=new THREE.Group(); tw.position.set(wx,heightAt(wx,wz),wz); const steel=stdMat(0x9fa4a8,{metalness:0.6,roughness:0.4});
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,16,6),steel); leg.position.set(a*2.6,8,b*2.6); tw.add(leg); }
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(5,5,6,24),new THREE.MeshStandardMaterial({map:textPanelTex([{text:'HONKY TONK HWY',font:'bold 70px "Racing Sans One", Impact',color:'#c8201e',y:0.55}],{w:1024,h:200,bg:'#e9e4d8'}),roughness:0.6})); tank.position.y=19; tw.add(tank);
    const cap=new THREE.Mesh(new THREE.ConeGeometry(5.3,2.6,24),steel); cap.position.y=23.3; tw.add(cap); tw.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); G.add(tw); }
}

// ===== PARTICLES, SKIDS, RAIN =====
class Particles{
  constructor(max,additive){
    this.max=max; this.head=0;
    this.pos=new Float32Array(max*3); this.col=new Float32Array(max*4); this.size=new Float32Array(max);
    this.vel=new Float32Array(max*3); this.life=new Float32Array(max); this.ml=new Float32Array(max); this.s0=new Float32Array(max); this.s1=new Float32Array(max); this.a0=new Float32Array(max); this.drag=new Float32Array(max); this.grav=new Float32Array(max);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setAttribute('color',new THREE.BufferAttribute(this.col,4)); g.setAttribute('size',new THREE.BufferAttribute(this.size,1));
    this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,uniforms:{scale:{value:600}},
      vertexShader:'attribute vec4 color;attribute float size;uniform float scale;varying vec4 vC;void main(){vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*scale/max(0.1,-mv.z);gl_Position=projectionMatrix*mv;}',
      fragmentShader:'varying vec4 vC;void main(){vec2 d=gl_PointCoord-0.5;float a=smoothstep(0.5,0.1,length(d));if(a<0.01)discard;gl_FragColor=vec4(vC.rgb,vC.a*a);}'});
    this.points=new THREE.Points(g,this.mat); this.points.frustumCulled=false; this.geo=g; this.alive=0;
  }
  emit(x,y,z,vx,vy,vz,life,s0,s1,r,g,b,a,drag=1,grav=0){
    const i=this.head; this.head=(this.head+1)%this.max;
    this.pos[i*3]=x;this.pos[i*3+1]=y;this.pos[i*3+2]=z; this.vel[i*3]=vx;this.vel[i*3+1]=vy;this.vel[i*3+2]=vz;
    this.life[i]=life;this.ml[i]=life;this.s0[i]=s0;this.s1[i]=s1;this.col[i*4]=r;this.col[i*4+1]=g;this.col[i*4+2]=b;this.a0[i]=a;this.drag[i]=drag;this.grav[i]=grav;
  }
  update(dt){
    const P=this.pos,V=this.vel;
    for(let i=0;i<this.max;i++){ if(this.life[i]<=0){ if(this.size[i]!==0){this.size[i]=0;this.col[i*4+3]=0;} continue; }
      const l=this.life[i]-=dt; if(l<=0){ this.size[i]=0; this.col[i*4+3]=0; continue; }
      const k=Math.exp(-this.drag[i]*dt); V[i*3]*=k; V[i*3+1]=V[i*3+1]*k-this.grav[i]*dt; V[i*3+2]*=k;
      P[i*3]+=V[i*3]*dt; P[i*3+1]+=V[i*3+1]*dt; P[i*3+2]+=V[i*3+2]*dt;
      const f=l/this.ml[i]; this.size[i]=this.s1[i]+(this.s0[i]-this.s1[i])*f; this.col[i*4+3]=this.a0[i]*Math.min(1,f*1.5); }
    this.geo.attributes.position.needsUpdate=true; this.geo.attributes.color.needsUpdate=true; this.geo.attributes.size.needsUpdate=true;
  }
  clear(){ this.life.fill(0); this.size.fill(0); }
}
class Skids{
  constructor(max=1600){
    this.max=max; this.head=0; this.pos=new Float32Array(max*4*3); const idx=new Uint32Array(max*6);
    for(let q=0;q<max;q++){ const v=q*4; idx.set([v,v+1,v+2,v+1,v+3,v+2],q*6); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.pos,3)); g.setIndex(new THREE.BufferAttribute(idx,1));
    this.mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4})); this.mesh.frustumCulled=false; this.geo=g; this.dirty=false;
  }
  add(x0,y0,z0,x1,y1,z1,rx,rz,w){
    const q=this.head; this.head=(this.head+1)%this.max; const o=q*12, p=this.pos;
    p[o]=x0-rx*w;p[o+1]=y0;p[o+2]=z0-rz*w; p[o+3]=x0+rx*w;p[o+4]=y0;p[o+5]=z0+rz*w;
    p[o+6]=x1-rx*w;p[o+7]=y1;p[o+8]=z1-rz*w; p[o+9]=x1+rx*w;p[o+10]=y1;p[o+11]=z1+rz*w; this.dirty=true;
  }
  update(){ if(this.dirty){ this.geo.attributes.position.needsUpdate=true; this.dirty=false; } }
  clear(){ this.pos.fill(0); this.dirty=true; }
}
class Rain{
  constructor(n=700){ this.n=n; this.p=new Float32Array(n*6); this.off=new Float32Array(n*3);
    for(let i=0;i<n;i++){ this.off[i*3]=Math.random()*60-30; this.off[i*3+1]=Math.random()*30; this.off[i*3+2]=Math.random()*60-30; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.p,3)); this.geo=g;
    this.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8fa8ff,transparent:true,opacity:0.35})); this.mesh.frustumCulled=false; }
  update(dt,cam,vx,vz){ const o=this.off,p=this.p; for(let i=0;i<this.n;i++){ o[i*3+1]-=dt*38; if(o[i*3+1]<0) o[i*3+1]+=30;
      const x=cam.x+(((o[i*3]-vx*0.0)%60+90)%60-30), y=cam.y-12+o[i*3+1], z=cam.z+(((o[i*3+2])%60+90)%60-30);
      p[i*6]=x;p[i*6+1]=y;p[i*6+2]=z; p[i*6+3]=x-vx*0.02;p[i*6+4]=y+0.9;p[i*6+5]=z-vz*0.02; }
    this.geo.attributes.position.needsUpdate=true; }
}

// ===== CAR: arcade physics + visual state =====
const GRAV=30;
const DRIFT_TIERS=[1.1,2.1,3.3], DRIFT_BOOST=[0.55,0.85,1.2];
const TIER_COL=[[0.35,0.75,1.0],[1.0,0.6,0.15],[1.0,0.25,0.85]];
class Car{
  constructor(race,v,idx,isPlayer){
    this.race=race; this.v=v; this.idx=idx; this.isPlayer=isPlayer; this.name=v.name;
    this.ph=vehiclePhysics(v); this.model=buildCarModel(v,race.env);
    this.halfW=this.model.dims.W/2; this.halfL=this.model.dims.L/2;
    this.radius=Math.max(1.15,Math.min(1.5,this.model.dims.L*0.29));
    this.inp={thr:0,brk:0,steer:0,drift:false,item:false};
    this.pr={}; this.reset0();
  }
  reset0(){
    this.x=0;this.y=0;this.z=0;this.h=0;this.vx=0;this.vz=0;this.vy=0;this.vF=0;this.vS=0;this.yaw=0;this.steerS=0;
    this.grounded=true;this.air=0;this.uPrev=0;this.i=0;this.offroad=false;
    this.drifting=false;this.driftDir=0;this.driftT=0;this.tier=-1;this.boost=0;this.boostMax=1;
    this.shield=0;this.spin=0;this.spinDir=1;this.ghost=0;this.item=null;this.itemCD=0;
    this.susp=0;this.suspV=0;this.lonA=0;this.latA=0;this.visYaw=0;this.pitch=0;
    this.lap=0;this.cp=0;this.cpCount=0;this.finished=false;this.finishTime=0;this.lapStart=0;this.lapTimes=[];this.bestLap=null;
    this.score=0;this.rank=1;this.wrongT=0;this.stuckT=0;this.lastSafe=0;this.wallHit=0;this.skidAmt=0;this.lastImpact=0;
    this.prevWheel=[null,null]; this.airTime=0; this.itemDelay=0; this.rubber=1; this.skill=1;
  }
  place(i,lat){
    const P=this.race.P; this.i=i; this.x=P.x[i]+P.rx[i]*lat; this.z=P.z[i]+P.rz[i]*lat; this.y=P.y[i];
    this.h=Math.atan2(P.tx[i],P.tz[i]); this.vx=this.vz=this.vy=0; this.vF=this.vS=0; this.yaw=0; this.grounded=true;
    this.drifting=false; this.boost=0; this.spin=0; this.susp=0; this.suspV=0; this.uPrev=0;
    P.project(this.x,this.z,this.i,this.pr); this.prevWheel=[null,null];
  }
  respawn(){
    const R=this.race,P=R.P; let i=this.lastSafe;
    // step back out of any gap / ramp
    for(const j of (P.def.jumps||[])){ const d=(i-j.i0+P.N)%P.N; if(d<Math.round((j.len+j.gap+6)/P.spacing)+2) i=(j.i0-6+P.N)%P.N; }
    let lat=clamp(this.pr.lat||0,-P.w[i]/2+2,P.w[i]/2-2); if(P.median[i]>0.3) lat=(lat<0?-1:1)*(P.median[i]+2.5);
    this.place(i,lat); this.vF=8; this.ghost=2.2; this.stuckT=0; this.wrongT=0;
    if(this.isPlayer){ R.sfx('respawn'); R.cam.snap=true; }
  }
  step(dt){
    const R=this.race,P=R.P,ph=this.ph,inp=this.inp,pr=this.pr;
    if(this.ghost>0) this.ghost-=dt; if(this.shield>0) this.shield-=dt; if(this.itemCD>0) this.itemCD-=dt;
    let fx=Math.sin(this.h),fz=Math.cos(this.h),rx=-fz,rz=fx;
    let vF=this.vx*fx+this.vz*fz, vS=this.vx*rx+this.vz*rz;
    this.i=P.nearest(this.x,this.z,this.i,8); P.project(this.x,this.z,this.i,pr);
    const halfRoad=pr.w/2+0.9; this.offroad=Math.abs(pr.lat)>halfRoad && !P.tunnel[pr.i];
    const onMedian=pr.median>0.3 && Math.abs(pr.lat)<pr.median+0.2;
    // --- steering input smoothing ---
    let st=inp.steer; if(this.spin>0) st=0;
    this.steerS+= (st-this.steerS)*Math.min(1,dt*(Math.abs(st)>Math.abs(this.steerS)?9:14));
    const s=this.steerS, sp=Math.abs(vF);
    // --- drift state ---
    if(this.grounded && !this.drifting && inp.drift && Math.abs(s)>0.3 && vF>14 && this.spin<=0){
      this.drifting=true; this.driftDir=Math.sign(s); this.driftT=0; this.tier=-1; this.vy=3.2; this.grounded=false; this.air=0;
      if(this.isPlayer) R.sfx('hop');
    }
    if(this.drifting){
      if(!inp.drift || vF<9 || this.spin>0){ this.endDrift(); }
      else if(this.grounded){ this.driftT+=dt*(0.6+0.4*Math.abs(s)+(s*this.driftDir>0?0.3:0))*clamp(Math.abs(this.yaw)/1.0,0.3,1.1);
        const t=DRIFT_TIERS.findIndex((x,k)=>this.driftT>=x && (k===2||this.driftT<DRIFT_TIERS[k+1]));
        if(t>this.tier){ this.tier=t; if(this.isPlayer) R.sfx('tier',t); } }
    }
    // --- yaw ---
    let yawT;
    if(this.drifting){ const amt=0.42+0.58*((s*this.driftDir)+1)/2; yawT=this.driftDir*ph.steer*amt*(0.85+ph.drift*0.3)/(1+sp/48); }
    else { yawT=s*ph.steer*clamp(sp/5,0,1)/(1+sp/34)*Math.sign(vF||1); if(inp.drift && sp>4) yawT*=1.35; }
    if(!this.grounded) yawT*=0.35;
    if(this.spin>0){ yawT=this.spinDir*9; this.spin-=dt; }
    this.yaw+=(yawT-this.yaw)*Math.min(1,dt*(this.grounded?9:3));
    this.h-=this.yaw*dt;
    // re-express velocity in new frame (velocity stays, heading rotated → slip appears)
    fx=Math.sin(this.h);fz=Math.cos(this.h);rx=-fz;rz=fx;
    vF=this.vx*fx+this.vz*fz; vS=this.vx*rx+this.vz*rz;
    // --- longitudinal ---
    const boosting=this.boost>0; if(boosting) this.boost-=dt;
    let top=ph.top*this.rubber*this.skill*(this.offroad?0.6:1)*(boosting?(this.boostMul||1.28):1)*(this.spin>0?0.5:1);
    const vF0=vF;
    if(this.grounded){
      if(boosting){ if(vF<top) vF+=Math.max(ph.accel,40)*dt; }
      if(inp.thr>0 && this.spin<=0){ if(vF<top) vF+=ph.accel*inp.thr*Math.max(0.12,1-Math.pow(Math.max(0,vF)/top,2))*dt*(vF<0?2.2:1); }
      if(vF>top) vF-=(vF-top)*(this.offroad?2.2:1.1)*dt;
      if(inp.brk>0){ if(vF>0.5) vF-=40*inp.brk*dt*(this.drifting?0.3:1); else if(vF>-14) vF-=14*inp.brk*dt; }
      if(inp.thr<=0 && inp.brk<=0) vF-=vF*0.35*dt+Math.sign(vF)*Math.min(Math.abs(vF),2.5*dt*60/60);
      if(this.offroad && vF>top*0.8) vF-=vF*0.9*dt;
      if(this.drifting) vF-=vF*0.04*dt;
      // lateral grip
      const g= this.drifting? 3.0+ph.drift*1.0 : (this.offroad?4.2:ph.grip) * (inp.drift&&!this.drifting?0.55:1);
      const nvS=vS*Math.exp(-g*dt); const lost=Math.abs(vS)-Math.abs(nvS);
      if(this.drifting) vF+=lost*0.3; else vF+=lost*0.12*Math.sign(vF);
      vS=nvS;
    } else { vS*=Math.exp(-0.4*dt); vF-=vF*0.02*dt; }
    this.lonA=lerp(this.lonA,(vF-vF0)/dt,0.1);
    this.latA=lerp(this.latA,this.yaw*vF,0.1);
    this.vF=vF; this.vS=vS;
    this.vx=fx*vF+rx*vS; this.vz=fz*vF+rz*vS;
    // --- integrate position ---
    this.x+=this.vx*dt; this.z+=this.vz*dt;
    this.i=P.nearest(this.x,this.z,this.i,8); P.project(this.x,this.z,this.i,pr);
    // --- vertical ---
    const along=this.vx*pr.tx+this.vz*pr.tz;
    const groundY=pr.gap?pr.h-40:pr.h;
    const u=pr.slope*along; // road vertical speed under the car
    if(this.grounded){
      const req=(u-this.uPrev)/dt;
      if(pr.gap || req<-GRAV*1.05){ this.grounded=false; this.vy=this.uPrev; this.air=0; }
      else { this.y=groundY; this.vy=u; }
    }
    if(!this.grounded){
      this.vy-=GRAV*dt; this.y+=this.vy*dt; this.air+=dt;
      if(this.y<=groundY){
        const imp=Math.max(0,u-this.vy); this.y=groundY; this.grounded=true;
        this.suspV-=Math.min(imp,14)*0.9; if(this.drifting && this.air<0.4){} else if(this.air>0.35){ if(this.isPlayer){ R.sfx('land',imp); R.shake(Math.min(0.5,imp*0.03)); } R.fx.dustBurst(this); }
        this.vy=u;
      }
      if(pr.gap && this.y<pr.h-6){ this.respawn(); return; }
    }
    this.uPrev=this.grounded?u:this.vy;
    if(this.grounded && !pr.gap && !this.offroad && Math.abs(pr.lat)<pr.w/2-1) this.lastSafe=pr.i;
    // --- walls (only when near road level) ---
    if(this.y>pr.h-4){
      const lim=this.halfW*0.9;
      let push=0,nx=0,nz=0;
      if(pr.lat>pr.wr-lim){ push=pr.lat-(pr.wr-lim); nx=-pr.rx; nz=-pr.rz; }
      else if(pr.lat<-pr.wl+lim){ push=(-pr.wl+lim)-pr.lat; nx=pr.rx; nz=pr.rz; }
      else if(onMedian || (pr.median>0.3 && Math.abs(pr.lat)<pr.median+lim)){ const sd=pr.lat>=0?1:-1; push=pr.median+lim-Math.abs(pr.lat); nx=pr.rx*sd; nz=pr.rz*sd; }
      if(push>0){ this.hitWall(push,nx,nz); }
    }
    // --- suspension spring ---
    const target=this.grounded? clamp(-this.lonA*0.004,-0.06,0.06):0.08;
    this.suspV+=((target-this.susp)*170-this.suspV*13)*dt; this.susp+=this.suspV*dt; this.susp=clamp(this.susp,-0.28,0.2);
    // stuck / wrong way detection
    const dirDot=fx*pr.tx+fz*pr.tz;
    if(dirDot<-0.4 && sp>3) this.wrongT+=dt; else this.wrongT=Math.max(0,this.wrongT-dt*2);
  }
  hitWall(push,nx,nz){
    const R=this.race; this.x+=nx*push; this.z+=nz*push;
    const vn=this.vx*nx+this.vz*nz;
    if(vn<0){
      const scrub=Math.max(0.55,1-(-vn)*0.022);
      let tx=(this.vx-nx*vn)*scrub, tz=(this.vz-nz*vn)*scrub;
      this.vx=tx-nx*vn*0.25; this.vz=tz-nz*vn*0.25;
      // nudge heading toward wall tangent
      const th=Math.atan2(tx,tz); const d=angDiff(this.h,th); if(Math.abs(d)<1.4) this.h+=d*Math.min(1,(-vn)*0.02);
      if(-vn>6){ if(this.drifting && -vn>12) this.endDrift(true); if(R.time-this.lastImpact>0.25){ this.lastImpact=R.time; R.impact(this,-vn,this.x-nx*this.halfW,this.y+0.5,this.z-nz*this.halfW); } }
      this.wallHit=0.3;
    }
  }
  endDrift(cancel){
    if(!this.drifting) return; this.drifting=false;
    if(!cancel && this.tier>=0){ this.giveBoost(DRIFT_BOOST[this.tier],1.2); if(this.isPlayer) this.race.sfx('boost',0.6+this.tier*0.2); }
    this.tier=-1; this.driftT=0;
  }
  giveBoost(t,mul=1.28){ this.boostMul=this.boost>0?Math.max(this.boostMul||1,mul):mul; this.boost=Math.max(this.boost,t); this.boostMax=Math.max(t,0.5); }
  spinOut(dur){ if(this.shield>0){ this.shield=0; this.race.sfx3d('shieldPop',this); return false; } this.spin=dur; this.spinDir=Math.random()<0.5?-1:1; this.endDrift(true); this.boost=0; this.vx*=0.45; this.vz*=0.45; return true; }
  // --- visuals ---
  visual(dt,t){
    const m=this.model, R=this.race, pr=this.pr;
    m.root.position.set(this.x,this.y+this.susp*0.3,this.z);
    const vis=this.drifting? -this.driftDir*0.32 : clamp(-this.vS*0.02,-0.2,0.2);
    this.visYaw+=(vis-this.visYaw)*Math.min(1,dt*6);
    m.root.rotation.order='YXZ'; m.root.rotation.y=this.h+this.visYaw;
    let targetPitch;
    if(this.grounded){ const fx=Math.sin(this.h),fz=Math.cos(this.h); const d=fx*pr.tx+fz*pr.tz; targetPitch=-Math.atan(pr.slope*d); }
    else { targetPitch=clamp(-Math.atan2(this.vy,Math.max(8,Math.abs(this.vF)))*0.6,-0.5,0.5); }
    this.pitch+=(targetPitch-this.pitch)*Math.min(1,dt*(this.grounded?14:3)); m.root.rotation.x=this.pitch;
    m.root.rotation.z=0;
    const ch=m.chassis; ch.position.y=-this.susp*0.7+(this.grounded?0:0.05);
    ch.rotation.x=clamp(this.lonA*0.0035,-0.07,0.07)+clamp(this.suspV*0.01,-0.04,0.04);
    ch.rotation.z=clamp(-this.latA*0.0028,-0.09,0.09);
    const wr=m.dims.wr; const spin=this.vF/wr*dt;
    for(const w of m.wheels) w.rotation.x+=spin;
    const sa=this.drifting? this.steerS*0.25-this.driftDir*0.3 : this.steerS*0.42;
    m.steerPivots.forEach(p=>p.rotation.y=-sa);
    const hover=this.grounded?0:0.12;
    m.wheels.forEach((w,k)=>{ w.parent.position.y=m.dims.wr-Math.max(-0.12,Math.min(0.12,this.susp*0.3))-hover*0; });
    const braking=this.inp.brk>0&&this.vF>1;
    m.tailMat.color.setRGB(braking?1:0.55,braking?0.12:0.03,braking?0.2:0.08);
    const b=this.boost>0; m.flames.forEach(f=>{ f.visible=b; if(b){ f.scale.z=0.8+Math.random()*0.9; } });
    if(b) m.flameMat.color.setHex(this.boostMax>1.3?0xff4fe0:0x6ff3ff);
    m.shield.visible=this.shield>0; if(this.shield>0){ m.shield.material.uniforms.t.value=t; m.shield.visible=this.shield>1.5||Math.sin(t*30)>0; }
    if(m.lightbar){ const f=Math.sin(t*14)>0; m.lightbar.red.color.setHex(f?0xff1030:0x300008); m.lightbar.blue.color.setHex(f?0x10103a:0x1a55ff); }
    if(m.anims) for(const f of m.anims) f(dt,t,this);
    m.root.visible= this.ghost>0 ? (Math.sin(t*40)>-0.3) : true;
    // effects
    const fx=R.fx; const fxv=Math.sin(this.h), fzv=Math.cos(this.h), rxv=-fzv, rzv=fxv;
    const rearZ=-m.dims.L*0.42, hw=m.dims.W*0.42;
    const near=R.nearCam(this);
    const slide=this.grounded && (this.drifting || Math.abs(this.vS)>4.5 || (braking&&this.vF>18));
    this.skidAmt=slide?Math.min(1,(Math.abs(this.vS)+(this.drifting?6:0))/12):0;
    for(let k=0;k<2;k++){
      const sd=k?1:-1; const wx=this.x+fxv*rearZ+rxv*hw*sd, wz=this.z+fzv*rearZ+rzv*hw*sd, wy=this.y+0.04;
      if(slide && !this.offroad){ const pw=this.prevWheel[k]; if(pw) fx.skids.add(pw[0],pw[1],pw[2],wx,wy,wz,rxv,rzv,0.16); this.prevWheel[k]=[wx,wy,wz]; } else this.prevWheel[k]=null;
      if(!near) continue;
      if(this.drifting && this.grounded){
        const c=this.tier>=0?TIER_COL[this.tier]:[1,0.9,0.7];
        const n=this.tier>=0?2:1;
        for(let q=0;q<n;q++) fx.sparks.emit(wx,wy+0.1,wz,-this.vx*0.1+rxv*sd*rr(1,4)+rr(-1,1),rr(1.5,4),-this.vz*0.1+rzv*sd*rr(1,4)+rr(-1,1),rr(0.2,0.4),this.tier>=0?0.35:0.22,0.05,c[0],c[1],c[2],1,2,9);
      }
      if((this.offroad && Math.abs(this.vF)>6) || (slide && Math.random()<0.4)){
        const dc=R.W.th.night?[0.35,0.33,0.45]:(this.offroad?R.dustCol:[0.85,0.85,0.85]);
        if(Math.random()<(this.offroad?0.7:0.35)) fx.dust.emit(wx,wy+0.2,wz,-this.vx*0.15+rr(-1,1),rr(0.5,2),-this.vz*0.15+rr(-1,1),rr(0.6,1.1),0.5,2.4,dc[0],dc[1],dc[2],this.offroad?0.45:0.25,1.5,-0.3);
      }
    }
    if(b && near){ for(const sd of [-1,1]){ const ex=this.x+fxv*(rearZ-0.3)+rxv*0.35*sd, ez=this.z+fzv*(rearZ-0.3)+rzv*0.35*sd; const c=this.boostMax>1.3?[1,0.35,0.9]:[0.4,0.9,1];
      fx.sparks.emit(ex,this.y+0.35,ez,-fxv*8+rr(-1,1)+this.vx*0.6,rr(0,1),-fzv*8+rr(-1,1)+this.vz*0.6,0.18,0.45,0.1,c[0],c[1],c[2],0.9,3,0); } }
  }
  get speed(){ return Math.hypot(this.vx,this.vz); }
}

// ===== CPU DRIVER =====
// shared per-track analysis: racing line + curvature
function analyzeTrack(P){
  const N=P.N, sp=P.spacing;
  // smoothed |curvature| and signed curvature
  const ca=new Float32Array(N), cs=new Float32Array(N);
  const K=6;
  for(let i=0;i<N;i++){ let a=0,b=0; for(let k=-K;k<=K;k++){ const j=(i+k+N)%N; a=Math.max(a,Math.abs(P.curv[j])); b+=P.curv[j]; } ca[i]=a; cs[i]=b/(2*K+1); }
  // racing line: inside at apex, outside on entry/exit
  const line=new Float32Array(N);
  for(let i=0;i<N;i++){
    let ahead=0,wsum=0; for(let k=-10;k<=22;k++){ const j=(i+k+N)%N; const w=k<0?0.5:1; ahead+=cs[j]*w; wsum+=w; } ahead/=wsum;
    const room=Math.max(0,P.w[i]/2-2.2);
    line[i]=-clamp(ahead*420,-1,1)*room; // inside of the turn (right = +lat)
  }
  for(let pass=0;pass<12;pass++){ const t=line.slice(); for(let i=0;i<N;i++){ let s=0; for(let k=-4;k<=4;k++) s+=t[(i+k+N)%N]; line[i]=s/9; } }
  // medians: pick one side per median run and blend in/out smoothly
  const med=[]; for(let i=0;i<N;i++) med.push(P.median[i]>0.05);
  let s0=0; while(s0<N && med[s0]) s0++;
  for(let k=0;k<N;k++){ const i=(s0+k)%N; if(!med[i] || med[(i-1+N)%N]) continue;
    let e=i, n=0; while(med[e%N] && n<N){ e++; n++; }
    let sum=0; for(let q=-40;q<-5;q++) sum+=line[(i+q+N)%N]; const side=sum<0?-1:1;
    for(let q=-45;q<n+30;q++){ const j=(i+q+N)%N; const mi=(i+clamp(q,0,n-1)+N)%N; const want=side*Math.min(P.median[mi]+2.8,P.w[j]/2-1.6);
      const blend=q<0?smooth01((q+45)/45):q>=n?smooth01((n+30-q)/30):1; const ok=side>0?Math.max(line[j],want):Math.min(line[j],want); line[j]=lerp(line[j],ok,blend); } }
  for(let i=0;i<N;i++){ const room=P.w[i]/2-1.6; line[i]=clamp(line[i],-room,room); }
  // jump approach: go straight down the middle-ish
  (P.def.jumps||[]).forEach(j=>{ const n=Math.round((j.len+j.gap)/sp)+14; for(let k=-20;k<n;k++){ const i=(j.i0+k+N)%N; line[i]*=0.2; } });
  return {ca,cs,line};
}
function speedProfile(P,A,steer){
  const N=P.N, v=new Float32Array(N);
  for(let i=0;i<N;i++){ const c=Math.max(A.ca[i],1e-5); const R=1/c; const cc=steer*R*0.82; v[i]=Math.min(80,(-1+Math.sqrt(1+4*cc/34))*17); }
  // jumps: never brake on kickers
  (P.def.jumps||[]).forEach(j=>{ const n=Math.round((j.len+j.gap)/P.spacing)+8; for(let k=-12;k<n;k++){ const q=(j.i0+k+N)%N; v[q]=Math.min(v[q],j.gap>0?36:42); } });
  const a=24, ds=P.spacing;
  for(let pass=0;pass<2;pass++) for(let q=2*N-1;q>=0;q--){ const i=q%N, j=(i+1)%N; v[i]=Math.min(v[i],Math.sqrt(v[j]*v[j]+2*a*ds)); }
  return v;
}
class AIDriver{
  constructor(car,race,skill,aggr){
    this.car=car; this.race=race; this.skill=skill; this.aggr=aggr;
    this.prof=speedProfile(race.P,race.A,car.ph.steer);
    this.lane=0; this.laneT=0; this.laneTimer=Math.random()*0.2; this.stuck=0; this.revT=0; this.stuckTotal=0; this.itemHold=0;
    this.wob=Math.random()*100; this.follow=null; this.cornerAcc=0; this.inCorner=false;
    const d=race.opt?race.opt.diff:'normal'; this.diff=d;
    this.corner=({easy:0.92,normal:1.0,hard:1.08})[d]||1.0; if(car.isPlayer) this.corner=0.97;
    this.driftSkill=0; this.boostSkill=car.isPlayer?0:(({easy:0,normal:0.5,hard:1})[d]||0);
  }
  update(dt){
    const c=this.car, R=this.race, P=R.P, A=R.A, inp=c.inp, N=P.N, sp=P.spacing;
    const v=Math.max(0,c.vF), i=c.pr.i!==undefined?c.pr.i:c.i;
    // ---------- traffic awareness (4 Hz) ----------
    this.laneTimer-=dt;
    if(this.laneTimer<=0){
      this.laneTimer=0.1; let want=0; this.follow=null; const myLat=c.pr.lat;
      for(const o of R.cars){ if(o===c||o.ghost>0||Math.abs(o.y-c.y)>2) continue;
        let d=((o.i-i+N)%N); if(d>N/2) d-=N; d*=sp; const dl=o.pr.lat-myLat;
        // car ahead in my path
        if(d>0 && d<10+v*0.45 && Math.abs(dl)<2.7){
          const closing=v-Math.max(0,o.vF);
          if(closing>-1){ const room=P.w[o.i]/2-1.8; const passR=room-o.pr.lat, passL=room+o.pr.lat;
            const side=(passR>=2.6&&(passR>passL||passL<2.6))?1:(passL>=2.6?-1:0);
            if(side!==0) want+=side*(2.9-Math.abs(dl)*0.4)*(0.9+this.aggr*0.4);
            if(!this.follow||d<this.follow.d) this.follow={d,v:Math.max(0,o.vF),dl}; }
        }
        // car alongside: give it room
        if(Math.abs(d)<5.5 && Math.abs(dl)<3.2){ want+=(dl>0?-1:1)*(3.2-Math.abs(dl))*0.9; }
      }
      for(const s of R.slicks){ const si=P.nearest(s.x,s.z,i,40); let d=((si-i+N)%N)*sp; if(d>2 && d<35){ const sl=P.project(s.x,s.z,si,{}).lat; const dl=sl-(A.line[si]+this.lane); if(Math.abs(dl)<2.8) want+=(dl>0?-1:1)*(3-Math.abs(dl)); } }
      // aim for boost pads ahead
      if(!this.follow) for(const p of R.W.pads){ let d=((p.i-i+N)%N)*sp; if(d>8&&d<60){ const dl=p.lat-A.line[p.i]; if(Math.abs(dl)<4.5 && Math.abs(this.laneT)<0.5) want+=dl*0.8; } }
      this.laneT=clamp(want,-5.5,5.5);
    }
    this.lane+=(this.laneT-this.lane)*Math.min(1,dt*2.2);
    if(Math.abs(this.laneT)<0.1) this.lane*=Math.exp(-dt*0.8);
    // ---------- steering: feed-forward curvature + Stanley lateral control ----------
    const ahead=Math.round((2+v*0.16)/sp);
    const ia=(i+ahead)%N, ib=(ia+4)%N;
    const room=P.w[ia]/2-1.5;
    let tgt=clamp(A.line[ia]+this.lane,-room,room);
    let mA=0; for(let k=0;k<14;k+=2) mA=Math.max(mA,P.median[(i+k)%N]);
    if(mA>0.3){ const m=mA+2.4; const side=Math.abs(c.pr.lat)>0.6?Math.sign(c.pr.lat):(Math.sign(tgt)||1); if(Math.sign(tgt)!==side||Math.abs(tgt)<m) tgt=side*Math.min(Math.max(Math.abs(tgt),m),room); }
    const lineSlope=(A.line[ib]-A.line[ia])/(4*sp);
    const th=Math.atan2(P.tx[ia],P.tz[ia]);
    const e=c.pr.lat-tgt; // + = too far right
    let vd=v*lineSlope-1.15*e; vd=clamp(vd,-0.3*Math.max(v,6),0.3*Math.max(v,6));
    const hd=th-Math.asin(clamp(vd/Math.max(v,6),-0.9,0.9));
    const hv=c.speed>4?Math.atan2(c.vx,c.vz):c.h;
    const ff=-v*P.curv[ia]; // yaw rate needed (+ = right; curv + = left)
    const steerGain=c.ph.steer*clamp(v/5,0,1)/(1+v/34);
    let steer=(steerGain>0.05?ff/steerGain:0)+3.2*angDiff(hd,hv);
    steer=clamp(steer,-1,1);
    // ---------- speed ----------
    let vT=1e9; const la=Math.round((4+v*0.4)/sp); for(let k=0;k<=la;k+=2){ vT=Math.min(vT,this.prof[(i+k)%N]); }
    vT*=this.corner*(1+Math.max(0,c.rubber-1)*0.5);
    if(this.follow){ const f=this.follow; const gap=f.d-c.halfL*2-0.8; const allowed=f.v+Math.max(0,gap)*0.8-(gap<0?3:0); const dlNow=f.dl-(this.lane-this.laneT)*0; if(Math.abs(f.dl)<2.4) vT=Math.min(vT,allowed); }
    let thr=1,brk=0;
    if(v>vT+1.2){ thr=0; brk=clamp((v-vT)/5,0.2,1); } else if(v>vT-0.5){ thr=0.4; }
    if(Math.abs(e)>4 && v>20){ thr=Math.min(thr,0.5); }
    // corner-exit boost (stands in for the drift boosts a skilled player earns)
    const cornerNow=this.prof[i]<c.ph.top*0.75;
    if(cornerNow){ this.cornerAcc=(this.cornerAcc||0)+dt; this.inC2=true; }
    else if(this.inC2){ this.inC2=false; if((this.boostSkill||0)>0 && this.cornerAcc>0.8 && Math.random()<this.boostSkill) c.giveBoost(Math.min(1.1,0.4+this.cornerAcc*0.3),1.2); this.cornerAcc=0; }
    // ---------- real drifting (disabled for CPUs; kept for experiments) ----------
    const ca=(i+6)%N, dirWant=-Math.sign(P.curv[ca]||0);
    const cornerSoon=this.prof[ca]<c.ph.top*0.82 && Math.abs(P.curv[ca])>0.008;
    if(cornerSoon && !this.inCorner){ this.inCorner=true; this.dRoll=Math.random(); } else if(!cornerSoon && this.prof[i]>c.ph.top*0.9) this.inCorner=false;
    let wantDrift=false;
    if(this.driftSkill>0 && this.revT<=0){
      if(c.drifting){
        const K=c.ph.steer*(0.85+c.ph.drift*0.3)/(1+Math.abs(c.vF)/48); const yd=steer*steerGain; const amt=yd*c.driftDir/Math.max(0.05,K);
        const stillCorner=this.prof[i]<c.ph.top*0.9 || cornerSoon;
        if(stillCorner && Math.abs(e)<3.8 && amt>0.25 && amt<1.3){ wantDrift=true; const a2=clamp(amt,0.42,1); steer=c.driftDir*(2*(a2-0.42)/0.58-1); }
      } else if(this.inCorner && this.dRoll<this.driftSkill && v>18 && !this.follow && Math.sign(steer)===dirWant && Math.abs(steer)>0.32 && Math.abs(e)<2.5){ wantDrift=true; }
    }
    // ---------- recovery ----------
    if(this.revT>0){ this.revT-=dt; thr=0; brk=1; steer=-Math.sign(e||1)*-1; steer=e>0?-1:1; steer=-steer; }
    else if(R.state==='race'||R.state==='finish'||R.state==='done'){
      if(c.speed<2.2 && c.spin<=0 && c.grounded){ this.stuck+=dt; this.stuckTotal+=dt; } else { this.stuck=0; this.stuckTotal=Math.max(0,this.stuckTotal-dt*0.5); }
      if(this.stuck>1.1){ this.revT=1.1; this.stuck=0; }
      if(this.stuckTotal>4.5 || c.wrongT>2.5){ c.respawn(); this.stuckTotal=0; this.revT=0; }
    }
    inp.thr=thr; inp.brk=brk; inp.steer=steer; inp.drift=wantDrift;
    // ---------- items ----------
    inp.item=false;
    if(c.item && c.itemDelay<=0){
      this.itemHold+=dt;
      if(c.item==='nitro'){ let clear=true; for(let k=0;k<40;k+=3){ if(this.prof[(i+k)%N]<v+10) {clear=false;break;} } if((clear&&!this.follow&&this.itemHold>0.5)||this.itemHold>8) inp.item=true; }
      else if(c.item==='aegis'){ if(this.itemHold>2+this.wob%3) inp.item=true; }
      else if(c.item==='slick'){ let behind=false; for(const o of R.cars){ if(o===c) continue; const d=((i-o.i+N)%N)*sp; if(d>3&&d<25&&Math.abs(o.pr.lat-c.pr.lat)<3) behind=true; } if((behind&&this.itemHold>0.6)||this.itemHold>10) inp.item=true; }
    } else this.itemHold=0;
  }
}

// ===== AUDIO (Web Audio, fully procedural) =====
class AudioEngine{
  constructor(settings){ this.S=settings; this.ctx=null; this.ok=false; this.musicMode='menu'; this.step=0; this.nextT=0; this.bar=0; }
  init(){
    if(this.ctx){ if(this.ctx.state==='suspended') this.ctx.resume(); return; }
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    try{ this.ctx=new AC(); }catch(e){ return; }
    const c=this.ctx; this.master=c.createGain(); this.master.connect(c.destination);
    this.comp=c.createDynamicsCompressor(); this.comp.threshold.value=-14; this.comp.ratio.value=4; this.comp.connect(this.master);
    this.sfxG=c.createGain(); this.sfxG.connect(this.comp); this.musG=c.createGain(); this.musG.connect(this.comp);
    // noise buffer
    const nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; this.noise=nb;
    // music delay bus
    this.dly=c.createDelay(1); this.dly.delayTime.value=60/108*0.75; this.fb=c.createGain(); this.fb.gain.value=0.32; const dlf=c.createBiquadFilter(); dlf.type='lowpass'; dlf.frequency.value=2400;
    this.dly.connect(dlf); dlf.connect(this.fb); this.fb.connect(this.dly); dlf.connect(this.musG);
    this.ok=true; this.apply(); this.nextT=c.currentTime+0.1;
    this.timer=setInterval(()=>this.schedule(),60);
  }
  apply(){ if(!this.ok) return; const S=this.S, t=this.ctx.currentTime;
    this.master.gain.setTargetAtTime(S.master,t,0.05); this.sfxG.gain.setTargetAtTime(S.sfx,t,0.05); this.musG.gain.setTargetAtTime(S.musicOn?S.music*0.55:0,t,0.1); }
  // ---------- engine / loops ----------
  startLoops(){
    if(!this.ok||this.eng) return; const c=this.ctx;
    const e={}; e.o1=c.createOscillator(); e.o1.type='sawtooth'; e.o2=c.createOscillator(); e.o2.type='square'; e.o3=c.createOscillator(); e.o3.type='triangle';
    e.f=c.createBiquadFilter(); e.f.type='lowpass'; e.f.Q.value=3; e.g=c.createGain(); e.g.gain.value=0;
    const g2=c.createGain(); g2.gain.value=0.5; e.o1.connect(e.f); e.o2.connect(g2); g2.connect(e.f); e.o3.connect(e.f); e.f.connect(e.g); e.g.connect(this.sfxG);
    [e.o1,e.o2,e.o3].forEach(o=>o.start());
    // opponents hum
    e.ao=c.createOscillator(); e.ao.type='sawtooth'; e.af=c.createBiquadFilter(); e.af.type='lowpass'; e.af.frequency.value=500; e.ag=c.createGain(); e.ag.gain.value=0; e.ao.connect(e.af); e.af.connect(e.ag); e.ag.connect(this.sfxG); e.ao.start();
    // skid
    const mk=(type,f,q)=>{ const s=c.createBufferSource(); s.buffer=this.noise; s.loop=true; const bf=c.createBiquadFilter(); bf.type=type; bf.frequency.value=f; bf.Q.value=q; const g=c.createGain(); g.gain.value=0; s.connect(bf); bf.connect(g); g.connect(this.sfxG); s.start(); return {s,bf,g}; };
    e.skid=mk('bandpass',1800,4); e.wind=mk('lowpass',600,0.5); e.rough=mk('lowpass',300,1);
    this.eng=e;
  }
  stopLoops(){ if(!this.eng) return; const e=this.eng; try{ [e.o1,e.o2,e.o3,e.ao,e.skid.s,e.wind.s,e.rough.s].forEach(o=>o.stop()); }catch(x){} [e.g,e.ag,e.skid.g,e.wind.g,e.rough.g].forEach(g=>g.disconnect()); this.eng=null; }
  updateCar(car,other,paused){
    if(!this.eng) return; const e=this.eng,t=this.ctx.currentTime;
    if(paused){ [e.g,e.ag,e.skid.g,e.wind.g,e.rough.g].forEach(g=>g.gain.setTargetAtTime(0,t,0.05)); return; }
    const v=Math.abs(car.vF), top=car.ph.top*1.1; const gears=[0,0.16,0.3,0.46,0.63,0.82,1.2];
    const r=v/top; let gi=1; while(gi<gears.length-1&&r>gears[gi]) gi++;
    const lo=gears[gi-1], hi=gears[gi]; let rpm=0.28+0.72*clamp((r-lo)/(hi-lo),0,1); if(!car.grounded) rpm=Math.min(1.05,rpm+0.2); if(car.inp.thr>0&&v<3) rpm=0.45+Math.random()*0.03;
    const f=48+rpm*115+(car.boost>0?15:0);
    e.o1.frequency.setTargetAtTime(f,t,0.03); e.o2.frequency.setTargetAtTime(f*0.5,t,0.03); e.o3.frequency.setTargetAtTime(f*2.01,t,0.03);
    e.f.frequency.setTargetAtTime(400+rpm*1400*(car.inp.thr>0?1.4:0.8),t,0.05);
    e.g.gain.setTargetAtTime(0.09+0.06*(car.inp.thr>0?1:0.4),t,0.05);
    e.skid.g.gain.setTargetAtTime(car.skidAmt*0.16*(car.offroad?0.2:1),t,0.04);
    e.wind.g.gain.setTargetAtTime(clamp(v/60,0,1)*0.12,t,0.1); e.wind.bf.frequency.setTargetAtTime(300+v*14,t,0.1);
    e.rough.g.gain.setTargetAtTime(car.offroad&&v>4?0.25:0,t,0.05);
    if(other){ const d=other.d; e.ao.frequency.setTargetAtTime(60+other.v*2.2,t,0.05); e.ag.gain.setTargetAtTime(clamp(1-d/30,0,1)*0.05,t,0.08); } else e.ag.gain.setTargetAtTime(0,t,0.1);
  }
  // ---------- one-shots ----------
  tone(freq,dur,type='sine',vol=0.2,when=0,slideTo=null,dest=null){
    if(!this.ok) return; const c=this.ctx,t=c.currentTime+when; const o=c.createOscillator(),g=c.createGain(); o.type=type; o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(dest||this.sfxG); o.start(t); o.stop(t+dur+0.05);
  }
  burst(dur,f,vol,type='lowpass',when=0,fEnd=null,dest=null){
    if(!this.ok) return; const c=this.ctx,t=c.currentTime+when; const s=c.createBufferSource(); s.buffer=this.noise; const bf=c.createBiquadFilter(); bf.type=type; bf.frequency.setValueAtTime(f,t); if(fEnd) bf.frequency.exponentialRampToValueAtTime(fEnd,t+dur);
    const g=c.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(bf); bf.connect(g); g.connect(dest||this.sfxG); s.start(t,Math.random()); s.stop(t+dur+0.05);
  }
  play(name,a=0){
    if(!this.ok) return;
    switch(name){
      case 'blip': this.tone(880,0.07,'square',0.06); break;
      case 'select': this.tone(660,0.08,'square',0.07); this.tone(1320,0.12,'square',0.06,0.06); break;
      case 'back': this.tone(520,0.1,'square',0.06,0,300); break;
      case 'count': this.tone(660,0.28,'square',0.13); this.tone(660,0.28,'sine',0.15); break;
      case 'go': this.tone(1320,0.6,'square',0.12); this.tone(1320,0.6,'sine',0.16); this.tone(660,0.6,'sawtooth',0.05); break;
      case 'impact': { const v=clamp(a/25,0.15,1); this.burst(0.25,900,0.5*v); this.tone(90,0.25,'sine',0.35*v,0,40); break; }
      case 'bump': this.burst(0.15,1400,0.25); this.tone(140,0.14,'triangle',0.2,0,70); break;
      case 'boost': this.burst(0.7,300,0.35,'bandpass',0,3500); this.tone(220,0.6,'sawtooth',0.08*(a||1),0,660); break;
      case 'pad': this.burst(0.6,500,0.3,'bandpass',0,4000); this.tone(440,0.35,'square',0.06,0,880); break;
      case 'hop': this.tone(300,0.08,'triangle',0.1,0,500); break;
      case 'tier': this.tone([700,900,1200][a]||700,0.15,'square',0.07); this.tone(([700,900,1200][a]||700)*1.5,0.15,'sine',0.07,0.05); break;
      case 'pickup': [0,1,2].forEach(k=>this.tone([784,988,1318][k],0.12,'square',0.07,k*0.05)); break;
      case 'roll': this.tone(1200+Math.random()*400,0.03,'square',0.035); break;
      case 'item': this.tone(1046,0.18,'triangle',0.12); this.tone(1568,0.2,'sine',0.1,0.06); break;
      case 'shield': this.tone(300,0.5,'sine',0.14,0,1200); this.tone(600,0.4,'triangle',0.06,0.05,1800); break;
      case 'shieldPop': this.burst(0.3,3000,0.3,'highpass'); this.tone(1400,0.25,'sine',0.12,0,300); break;
      case 'drop': this.tone(200,0.2,'sine',0.2,0,60); this.burst(0.2,600,0.2); break;
      case 'splat': this.burst(0.35,700,0.4,'lowpass',0,200); this.tone(500,0.4,'sawtooth',0.08,0,120); break;
      case 'land': this.tone(70,0.2,'sine',clamp(a/20,0.1,0.4),0,40); this.burst(0.12,700,clamp(a/40,0.05,0.3)); break;
      case 'respawn': this.tone(400,0.3,'sine',0.12,0,900); break;
      case 'lap': [0,1].forEach(k=>this.tone([880,1175][k],0.18,'square',0.08,k*0.12)); break;
      case 'final': [0,1,2].forEach(k=>this.tone([659,880,1318][k],0.22,'square',0.09,k*0.13)); break;
      case 'finish': [[523,659,784],[587,740,880],[659,831,988],[784,988,1175]].forEach((ch,k)=>ch.forEach(f=>this.tone(f,k===3?1.2:0.28,'square',0.05,k*0.2))); this.burst(1.5,2000,0.15,'highpass',0.6); break;
      case 'shot': { const v=a||1; this.burst(0.09,2500,0.55*v,'highpass'); this.tone(220,0.12,'square',0.12*v,0,50); this.burst(0.35,700,0.12*v,'lowpass',0.05,200); break; }
      case 'hit': this.tone(1800,0.15,'triangle',0.15,0,900); this.burst(0.25,1200,0.4); this.tone(120,0.25,'sine',0.3,0,50); break;
      case 'warn': this.tone(880,0.12,'square',0.07); this.tone(880,0.12,'square',0.07,0.18); break;
      case 'wrong': this.tone(220,0.2,'square',0.06); break;
    }
  }
  // ---------- music sequencer ----------
  setMusic(mode){ this.musicMode=mode; }
  schedule(){
    if(!this.ok||!this.S.musicOn||this.S.music<=0.001) { if(this.ok) this.nextT=Math.max(this.nextT,this.ctx.currentTime+0.05); return; }
    const c=this.ctx, spb=60/108, st=spb/4;
    if(this.nextT<c.currentTime-0.2) this.nextT=c.currentTime+0.05;
    while(this.nextT<c.currentTime+0.25){ this.note16(this.step,this.nextT,st); this.step=(this.step+1)%256; this.nextT+=st; }
  }
  note16(s,t,st){
    const c=this.ctx, M=this.musG, race=this.musicMode==='race', calm=this.musicMode==='menu';
    const chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]; // Am F C G
    const bar=Math.floor(s/16)%4, ch=chords[bar], p=s%16, sec=Math.floor(s/64);
    const mf=n=>440*Math.pow(2,(n-69)/12);
    // bass: 8ths, octave pulse
    if(p%2===0){ const n=ch[0]-24+(p%4===2?12:0); this.voice(mf(n),st*1.8,'sawtooth',race?0.13:0.09,t,M,500+(race?300:0)); }
    // pad at bar start
    if(p===0){ ch.forEach(n=>{ this.voice(mf(n),st*16,'sawtooth',0.028,t,M,1200,0.6,true); this.voice(mf(n)*1.006,st*16,'sawtooth',0.02,t,M,1200,0.6,true); }); }
    // arp
    if(!calm || sec%2===1){ const arp=[0,1,2,1,0,2,1,2]; const n=ch[arp[p%8]]+12+(p>=8&&race?12:0); if(p%2===0||race) this.voice(mf(n),st*0.9,'square',race?0.035:0.03,t,this.dly,2600); }
    // drums
    if(race || sec%2===1){
      if(p%4===0) this.kick(t,race?0.55:0.35);
      if(p===4||p===12) this.snare(t,race?0.25:0.15);
      if(race && p%2===1) this.hat(t,0.05); else if(p%4===2) this.hat(t,0.05);
    }
    // lead melody in race mode, second half
    if(race && sec%2===1){ const mel=[[76,0],[74,4],[72,6],[74,8],[76,12]]; mel.forEach(([n,q])=>{ if(q===p && (bar%2===0)) this.voice(mf(n+(bar===2?-5:0)),st*3,'square',0.03,t,this.dly,1800); }); }
  }
  voice(f,dur,type,vol,t,dest,cut,atk=0.005,pad=false){
    const c=this.ctx; const o=c.createOscillator(), g=c.createGain(), bf=c.createBiquadFilter(); o.type=type; o.frequency.value=f; bf.type='lowpass'; bf.frequency.value=cut;
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+(pad?dur*0.3:atk)); g.gain.setTargetAtTime(0.0001,t+(pad?dur*0.6:dur*0.4),pad?dur*0.25:dur*0.3);
    o.connect(bf); bf.connect(g); g.connect(dest); if(dest===this.dly) g.connect(this.musG); o.start(t); o.stop(t+dur*1.6+0.1);
  }
  kick(t,v){ const c=this.ctx,o=c.createOscillator(),g=c.createGain(); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(40,t+0.15); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.3); o.connect(g); g.connect(this.musG); o.start(t); o.stop(t+0.35); }
  snare(t,v){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800; const g=c.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); s.connect(f); f.connect(g); g.connect(this.musG); g.connect(this.dly); s.start(t,Math.random()); s.stop(t+0.25); }
  hat(t,v){ const c=this.ctx,s=c.createBufferSource(); s.buffer=this.noise; const f=c.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000; const g=c.createGain(); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05); s.connect(f); f.connect(g); g.connect(this.musG); s.start(t,Math.random()); s.stop(t+0.07); }
}

// ===== HAZARD: roadside shooters (Alondra Boulevard) =====
function makeFlashTex(){ return canvasTex(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,230,1)'); gr.addColorStop(0.25,'rgba(255,220,120,0.95)'); gr.addColorStop(0.6,'rgba(255,140,40,0.35)'); gr.addColorStop(1,'rgba(255,100,0,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); }); }
class Shooters{
  constructor(R){
    this.R=R; const P=R.P, W=R.W, def=R.def; this.list=[]; this.shots=[]; this.zones=[]; this.t=0; this.warnLap={};
    const G=this.group=new THREE.Group(); R.scene.add(G);
    const skin=[0x8d5524,0xc68642,0x5a3a22,0xe0ac69], hood=[0xd62828,0x1f6fe0,0x2eae4a,0xf2b705,0x9b30d9,0xe8e8e8];
    const flashTex=makeFlashTex();
    this.tracerMat=new THREE.MeshBasicMaterial({color:0xfff0a0,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false});
    this.tracerGeo=new THREE.CylinderGeometry(0.13,0.13,6.5,6,1,true); this.tracerGeo.rotateX(Math.PI/2);
    const brick=canvasTex(128,64,(g,w,h)=>{ g.fillStyle='#6d3a2c'; g.fillRect(0,0,w,h); g.fillStyle='#8c4a36'; for(let r=0;r<8;r++) for(let c=0;c<5;c++){ g.fillRect((c*28+(r%2)*14)%w-4,r*8+1,24,6);} },{repeat:true});
    const brickM=new THREE.MeshStandardMaterial({map:brick,roughness:0.9}), stoopM=new THREE.MeshStandardMaterial({color:0x8a8580,roughness:0.9});
    (def.shooters||[]).forEach((z,zk)=>{
      const i0=P.idxAt(z.cp,z.f); this.zones.push({i0,i1:(i0+22)%P.N});
      [[0,-1],[18,1]].forEach(([off,sd],sk)=>{
        const i=(i0+off)%P.N; const e=(sd<0?P.wl[i]:P.wr[i])+1.9;
        const x=P.x[i]+P.rx[i]*e*sd, z2=P.z[i]+P.rz[i]*e*sd; const gy=Math.max(W.heightAt(x,z2),P.y[i]);
        const face=Math.atan2(-P.rx[i]*sd,-P.rz[i]*sd); // facing the road
        const base=new THREE.Group(); base.position.set(x,gy,z2); base.rotation.y=face; G.add(base);
        const stoop=new THREE.Mesh(new THREE.BoxGeometry(3.2,0.7,2.4),stoopM); stoop.position.y=0.35; stoop.castShadow=stoop.receiveShadow=true; base.add(stoop);
        const cover=new THREE.Mesh(new THREE.BoxGeometry(3.4,1.0,0.45),brickM); cover.position.set(0,1.2,1.1); cover.castShadow=true; base.add(cover);
        // figure
        const fig=new THREE.Group(); fig.position.y=0.7; fig.scale.setScalar(1.35); base.add(fig);
        const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:0.8});
        const hc=hood[(zk*2+sk)%hood.length];
        const legL=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.9,0.3),mat(0x22324a)); legL.position.set(-0.17,0.45,0); fig.add(legL);
        const legR=legL.clone(); legR.position.x=0.17; fig.add(legR);
        const torso=new THREE.Mesh(new THREE.BoxGeometry(0.72,0.8,0.42),mat(hc)); torso.position.y=1.3; fig.add(torso);
        const head=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,10),mat(skin[(zk+sk)%4])); head.position.y=1.93; fig.add(head);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(0.235,12,8,0,TAU,0,Math.PI/2),mat(sk?0x111111:hc)); cap.position.y=1.96; fig.add(cap);
        const brim=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.2),mat(0x111111)); brim.position.set(0,1.99,0.25); fig.add(brim);
        const armL=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.62,0.2),mat(hc)); armL.position.set(-0.46,1.35,0.05); armL.rotation.x=-0.5; fig.add(armL);
        const shoulder=new THREE.Group(); shoulder.position.set(0.44,1.6,0); fig.add(shoulder);
        const arm=new THREE.Mesh(new THREE.BoxGeometry(0.18,0.18,0.7),mat(hc)); arm.position.z=0.35; shoulder.add(arm);
        const gun=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.2,0.42),mat(0x0c0c0c)); gun.position.set(0,0.05,0.82); shoulder.add(gun);
        const flash=new THREE.Sprite(new THREE.SpriteMaterial({map:flashTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); flash.scale.set(2.6,2.6,1); flash.position.set(0,0.06,1.2); flash.visible=false; shoulder.add(flash);
        fig.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
        const MB=(typeof propTemplate==='function')?propTemplate('mrblack'):null, AKT=(typeof propTemplate==='function')?propTemplate('ak'):null;
        if(MB&&AKT){ fig.children.slice().forEach(ch=>{ if(ch!==shoulder) fig.remove(ch); }); fig.scale.setScalar(1.25);
          MB.parts.forEach(p=>{ const m=new THREE.Mesh(p.g,p.mt); m.castShadow=true; fig.add(m); });
          shoulder.children.slice().forEach(ch=>{ if(ch!==flash) shoulder.remove(ch); }); shoulder.position.set(0.2,1.36,0.12);
          const akg=new THREE.Group(); AKT.parts.forEach(p=>{ const m=new THREE.Mesh(p.g,p.mt); m.castShadow=true; akg.add(m); }); akg.rotation.y=Math.PI/2; akg.position.set(0,-0.12,0.3); shoulder.add(akg);
          flash.position.set(0,0.0,0.8); flash.scale.set(1.8,1.8,1); }
        this.list.push({base,fig,shoulder,flash,face,x,y:gy,z:z2,cd:1+Math.random()*2,flashT:0,yaw:0,pitch:0,zone:zk,idx:i});
      });
      // warning sign before the zone
      const wi=(i0-45+P.N)%P.N, sd=-1; const e=P.wl[wi]+1.4; const sx=P.x[wi]+P.rx[wi]*e*sd, sz=P.z[wi]+P.rz[wi]*e*sd;
      const sg=new THREE.Group(); sg.position.set(sx,W.heightAt(sx,sz),sz); sg.rotation.y=Math.atan2(-P.tx[wi],-P.tz[wi]); G.add(sg);
      const post=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,3.2,6),new THREE.MeshStandardMaterial({color:0x777777,metalness:0.6})); post.position.y=1.6; sg.add(post);
      const tex=canvasTex(256,256,(g)=>{ g.translate(128,128); g.rotate(Math.PI/4); g.fillStyle='#ffc400'; g.fillRect(-84,-84,168,168); g.lineWidth=10; g.strokeStyle='#111'; g.strokeRect(-76,-76,152,152); g.rotate(-Math.PI/4);
        g.fillStyle='#111'; g.textAlign='center'; g.font='bold 34px "Racing Sans One",Impact'; g.fillText('HOT',0,-8); g.fillText('BLOCK',0,30); g.font='bold 60px Impact'; g.fillText('!',0,-44); });
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshStandardMaterial({map:tex,transparent:true,side:THREE.DoubleSide,roughness:0.6})); pl.position.y=3.3; sg.add(pl);
    });
  }
  update(dt){
    const R=this.R, P=R.P, N=P.N; this.t+=dt; if(this.zoneCd) for(const k in this.zoneCd) this.zoneCd[k]-=dt;
    const live=R.state==='race'||R.state==='finish'||R.state==='done';
    for(const s of this.list){
      // pick nearest car in range, ahead of or beside the shooter
      let best=null,bd=1e9;
      for(const c of R.cars){ if(c.ghost>0) continue; const dx=c.x-s.x, dz=c.z-s.z, d=Math.hypot(dx,dz); if(d<6||d>48) continue; if(d<bd){bd=d;best=c;} }
      let ty=s.face, tp=0;
      if(best){ const dx=best.x-s.x, dz=best.z-s.z; ty=Math.atan2(dx,dz); tp=Math.atan2((best.y+0.7)-(s.y+2.3),Math.hypot(dx,dz)); }
      s.yaw+=angDiff(s.yaw,angDiff(s.face,ty))*Math.min(1,dt*6); s.yaw=clamp(s.yaw,-1.4,1.4);
      s.pitch+=(tp-s.pitch)*Math.min(1,dt*6);
      s.fig.rotation.y=s.yaw; s.shoulder.rotation.x=-s.pitch; s.shoulder.rotation.z=0;
      if(s.flashT>0){ s.flashT-=dt; s.flash.visible=s.flashT>0; s.flash.material.rotation=Math.random()*TAU; }
      s.cd-=dt;
      const zc=this.zoneCd||(this.zoneCd={}); if(live && best && s.cd<=0 && (zc[s.zone]||0)<=0 && Math.abs(angDiff(s.face,ty))<1.35){ this.fire(s,best); s.cd=3+Math.random()*1.5; zc[s.zone]=1.4; }
    }
    // projectiles
    for(let k=this.shots.length-1;k>=0;k--){
      const b=this.shots[k]; b.life-=dt;
      const x0=b.x,y0=b.y,z0=b.z; b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt; b.mesh.position.set(b.x,b.y,b.z);
      let done=b.life<=0;
      if(!done && b.intent) for(const c of [b.target]){ if(c.ghost>0) continue; const d=segDist(c.x,c.y+0.7,c.z,x0,y0,z0,b.x,b.y,b.z); if(d<1.25){ this.hit(c,b); done=true; break; } }
      if(!done && b.y<R.W.heightAt(b.x,b.z)+0.05){ for(let q=0;q<6;q++) R.fx.sparks.emit(b.x,b.y+0.1,b.z,rr(-3,3),rr(1,4),rr(-3,3),0.25,0.2,0.03,1,0.8,0.4,1,2,10); R.fx.dust.emit(b.x,b.y+0.2,b.z,0,1,0,0.6,0.3,1.2,0.7,0.7,0.7,0.4,1,0); done=true; }
      if(done){ this.group.remove(b.mesh); this.shots.splice(k,1); }
    }
    // HUD warning for the player on approach
    const pl=R.player; if(live && !pl.finished){ this.zones.forEach((z,k)=>{ const d=((z.i0-pl.pr.i+N)%N)*P.spacing; const key=k+'_'+pl.lap; if(d>20&&d<90&&!this.warnLap[key]){ this.warnLap[key]=1; R.game.ui.flash('⚠ HOT BLOCK AHEAD','#ffc400',1.4); R.sfx('warn'); } }); }
  }
  fire(s,c){
    const R=this.R; let b_intent=false; s.flashT=0.07; s.flash.visible=true;
    s.shoulder.updateMatrixWorld(true); const m=new THREE.Vector3(0,0.06,1.1).applyMatrix4(s.shoulder.matrixWorld);
    // aim with lead + deliberate spread (roughly 1 in 3 connects)
    const spd=95; let tx=c.x,ty=c.y+0.7,tz=c.z; for(let it=0;it<2;it++){ const t=Math.hypot(tx-m.x,tz-m.z)/spd; tx=c.x+c.vx*t; tz=c.z+c.vz*t; }
    const hitChance=c.isPlayer?0.22:0.3; const miss=Math.random()>hitChance;
    if(miss){ if(Math.random()<0.5){ ty+=rr(1.9,2.6); } else { const t=rr(3,6); const sp=Math.max(1,Math.hypot(c.vx,c.vz)); tx-=c.vx/sp*t*0; tz-=0; const fx=tx-m.x,fz=tz-m.z,fl=Math.hypot(fx,fz); tx-=fx/fl*t; tz-=fz/fl*t; ty=R.W.heightAt(tx,tz)-0.3; } }
    b_intent=!miss;
    const dx=tx-m.x,dy=ty-m.y,dz=tz-m.z,d=Math.hypot(dx,dy,dz);
    const b={intent:b_intent,target:c,x:m.x,y:m.y,z:m.z,vx:dx/d*spd,vy:dy/d*spd,vz:dz/d*spd,life:1.1,owner:s};
    b.mesh=new THREE.Mesh(this.tracerGeo,this.tracerMat); b.mesh.position.set(b.x,b.y,b.z); b.mesh.lookAt(b.x+b.vx,b.y+b.vy,b.z+b.vz); this.group.add(b.mesh); this.shots.push(b);
    const cp=R.game.camera.position; const dist=Math.hypot(s.x-cp.x,s.z-cp.z); if(dist<120) R.game.audio.play('shot',clamp(1-dist/120,0.15,1));
  }
  hit(c,b){
    const R=this.R;
    for(let q=0;q<14;q++) R.fx.sparks.emit(c.x,c.y+0.8,c.z,rr(-5,5),rr(1,5),rr(-5,5),0.35,0.3,0.05,1,0.85,0.4,1,2,10);
    const spun=c.spinOut(1.0);
    if(c.isPlayer){ if(spun){ R.sfx('hit'); R.shake(0.35); R.game.ui.flash('YOU GOT HIT!','#ff3b3b',1.4); } else R.game.ui.flash('SHIELD BLOCKED IT','#7ff6ff',1.2); }
    else if(spun) R.sfx3d('hit',c);
  }
}
function segDist(px,py,pz,ax,ay,az,bx,by,bz){ const vx=bx-ax,vy=by-ay,vz=bz-az; const wx=px-ax,wy=py-ay,wz=pz-az; const L=vx*vx+vy*vy+vz*vz; const t=L>0?clamp((wx*vx+wy*vy+wz*vz)/L,0,1):0; const dx=wx-vx*t,dy=wy-vy*t,dz=wz-vz*t; return Math.sqrt(dx*dx+dy*dy+dz*dz); }

// ===== RACE MANAGER =====
const NCP=12, DT=1/120;
const DIFFS={easy:{base:0.9,rb:0.05,label:'Easy'},normal:{base:1.0,rb:0.1,label:'Normal'},hard:{base:1.07,rb:0.18,label:'Hard'}};
const ITEMS={nitro:{name:'Nitro Cell',icon:'⚡',col:'#22e4ff'},aegis:{name:'Aegis Bubble',icon:'◈',col:'#7ff6ff'},slick:{name:'Glaze Slick',icon:'◍',col:'#ff4fb0'}};
class Race{
  constructor(game,opt){
    this.game=game; this.opt=opt; this.def=TRACK_DATA[opt.track]; this.laps=this.def.laps;
    const Q=game.Q; this.time=0; this.raceTime=0; this.state='intro'; this.stateT=0; this.acc=0; this.paused=false;
    this.P=buildTrackPath(this.def); this.A=analyzeTrack(this.P);
    this.W=buildWorld(this.def,this.P,Q);
    this.scene=new THREE.Scene(); this.scene.add(this.W.group); this.scene.fog=this.W.fog;
    this.env=makeEnvFromTheme(game.renderer,this.W.th); this.scene.environment=null;
    setEnvOnCarMats(this.env);
    this.dustCol=({country:[0.62,0.34,0.2],city:[0.75,0.7,0.6],desert:[0.85,0.62,0.42],coast:[0.72,0.64,0.5],night:[0.4,0.38,0.5]})[this.def.theme];
    // fx
    this.fx={sparks:new Particles(Q.density>0.7?1600:900,true),dust:new Particles(Q.density>0.7?900:500,false),skids:new Skids(Q.density>0.7?1400:700)};
    this.fx.dustBurst=(car)=>{ if(!this.nearCam(car)) return; for(let k=0;k<14;k++) this.fx.dust.emit(car.x+rr(-1.5,1.5),car.y+0.2,car.z+rr(-1.5,1.5),rr(-4,4)+car.vx*0.2,rr(0.5,2.5),rr(-4,4)+car.vz*0.2,rr(0.6,1.2),0.8,3,this.dustCol[0],this.dustCol[1],this.dustCol[2],0.45,2,-0.2); };
    this.scene.add(this.fx.skids.mesh,this.fx.dust.points,this.fx.sparks.points);
    if(this.W.rain && Q.density>0.4){ this.rain=new Rain(Math.round(900*Q.density)); this.scene.add(this.rain.mesh); }
    // cars
    const pv=VEHICLES[opt.vehicle]; const others=VEHICLES.filter(v=>v!==pv);
    const shuffled=others.slice().sort((a,b)=>(a.id.charCodeAt(1)*7+opt.track*13)%11-(b.id.charCodeAt(1)*7+opt.track*13)%11);
    const field=opt.field?opt.field.map(id=>VEHICLES.find(v=>v.id===id)).filter(Boolean):shuffled.slice(0,7);
    const total=field.length+1;
    const d=DIFFS[opt.diff]; const spread=[0.02,0.012,0.006,0,-0.006,-0.012,-0.02];
    this.cars=[]; const playerSlot=Math.min(total-1,opt.diff==='easy'?3:opt.diff==='hard'?7:5); let ai=0;
    for(let s=0;s<total;s++){
      const isP=s===playerSlot; const v=isP?pv:field[ai]; const car=new Car(this,v,s,isP);
      car.driver=isP?'YOU':v.driver;
      car.place(this.W.grid[s].i,this.W.grid[s].lat); car.cp=0; car.cpCount=0; car.lap=0;
      if(!isP){ car.skill=d.base+spread[ai]; car.ai=new AIDriver(car,this,car.skill,(ai*37%10)/10); ai++; }
      else { this.player=car; this.auto=new AIDriver(car,this,1,0.5); }
      this.scene.add(car.model.root); this.cars.push(car);
    }
    this.cpIdx=[]; for(let k=0;k<NCP;k++) this.cpIdx.push(Math.round(k*this.P.N/NCP)%this.P.N);
    this.slicks=[]; this.finishOrder=[]; this.best=Store.get('best_'+this.def.id,{race:null,lap:null});
    if(this.def.shooters) this.shooters=new Shooters(this);
    this.cam=new ChaseCam(this); this.trauma=0; this.msgT=0; this.hudT=0; this.finalShown=false; this.resetCD=0;
    this.slickGeo=new THREE.CircleGeometry(1.7,24); this.slickMat=new THREE.MeshStandardMaterial({map:canvasTex(128,128,(g)=>{ const gr=g.createRadialGradient(64,64,10,64,64,64); gr.addColorStop(0,'#ffd1ea'); gr.addColorStop(0.75,'#ff4fb0'); gr.addColorStop(1,'rgba(255,79,176,0)'); g.fillStyle=gr; g.beginPath(); for(let a=0;a<24;a++){ const r=48+Math.sin(a*2.3)*10; g.lineTo(64+Math.cos(a/24*TAU)*r,64+Math.sin(a/24*TAU)*r);} g.fill(); const cs=['#22e4ff','#ffe14f','#fff','#7dff6a']; for(let k=0;k<40;k++){ g.fillStyle=cs[k%4]; g.save(); g.translate(30+Math.random()*68,30+Math.random()*68); g.rotate(Math.random()*6); g.fillRect(-5,-1.5,10,3); g.restore(); } }),transparent:true,roughness:0.15,metalness:0.1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
    game.audio.startLoops(); game.audio.setMusic('race');
    this.buildMiniPath(); game.ui.raceStart(this);
  }
  // ---------- helpers used by Car ----------
  nearCam(car){ const c=this.game.camera.position; const dx=car.x-c.x,dz=car.z-c.z; return dx*dx+dz*dz<110*110; }
  sfx(n,a){ this.game.audio.play(n,a); }
  sfx3d(n,car){ const c=this.game.camera.position; const d=Math.hypot(car.x-c.x,car.z-c.z); if(car.isPlayer||d<40) this.game.audio.play(n); }
  shake(a){ if(this.game.S.shake) this.trauma=Math.min(1,this.trauma+a); }
  impact(car,v,x,y,z){
    for(let k=0;k<Math.min(24,v);k++) this.fx.sparks.emit(x,y,z,rr(-5,5)+car.vx*0.3,rr(1,5),rr(-5,5)+car.vz*0.3,rr(0.15,0.4),0.3,0.05,1,0.8,0.4,1,2,12);
    if(car.isPlayer){ this.sfx('impact',v); this.shake(Math.min(0.55,v*0.025)); } else this.sfx3d('bump',car);
  }
  // ---------- main update ----------
  update(dt,input){
    dt=Math.min(dt,0.1); const P=this.P, pl=this.player;
    if(this.paused){ this.game.audio.updateCar(pl,null,true); this.render(); return; }
    this.stateT+=dt;
    if(this.state==='intro'){ if(this.stateT>4.2||input.skip){ this.state='countdown'; this.stateT=0; this.lastCount=-1; this.game.ui.introCard(false); } }
    if(this.state==='countdown'){
      const n=Math.floor(this.stateT); if(n!==this.lastCount && n<=3){ this.lastCount=n; if(n<3){ this.sfx('count'); this.game.ui.count(String(3-n)); this.W.lamps.forEach((m,k)=>m.color.setHex(k<=(n*2)?0xff1a1a:0x220808)); } else { this.sfx('go'); this.game.ui.count('GO!'); this.W.lamps.forEach(m=>m.color.setHex(0x18ff5a)); this.state='race'; this.stateT=0; } }
      // launch boost: holding throttle right at GO
    }
    // inputs
    if(this.state==='race'||this.state==='finish'||this.state==='done'){
      if(pl.finished){ this.auto.update(dt); }
      else { const I=pl.inp; I.thr=input.thr; I.brk=input.brk; I.steer=input.steer; I.drift=input.drift; if(input.item&&!this.itemLatch) I.item=true; this.itemLatch=input.item;
        if(this.game.autopilot){ this.auto.update(dt); }
        this.resetCD-=dt; if(input.reset && this.resetCD<=0){ this.resetCD=1.5; pl.respawn(); } }
      for(const c of this.cars) if(c.ai) c.ai.update(dt);
    } else { for(const c of this.cars){ c.inp.thr=0; c.inp.brk=1; c.inp.steer=0; } if(this.state==='countdown'&&this.stateT>2.55&&input.thr>0) this.launch=true; }
    if(this.state==='race' && this.stateT<0.05 && this.launch){ pl.giveBoost(0.8); this.sfx('boost'); this.launch=false; this.game.ui.flash('ROCKET START!','#22e4ff'); }
    // fixed-step simulation
    this.acc+=dt; let steps=0;
    while(this.acc>=DT && steps<14){ this.simStep(); this.acc-=DT; steps++; }
    if(steps>=14) this.acc=0;
    if(this.state==='race'||this.state==='finish'||this.state==='done') this.raceTime+=dt;
    if(this.state==='finish'){ const allDone=this.cars.every(c=>c.finished); if(this.stateT>9||allDone){ this.state='done'; this.stateT=0; this.game.showResults(this.results()); } }
    // visuals
    for(const c of this.cars) c.visual(dt,this.time);
    this.W.update(dt,this.time); this.fx.sparks.update(dt); this.fx.dust.update(dt); this.fx.skids.update();
    this.slicks.forEach(s=>{ s.mesh.rotation.z+=dt*0.2; });
    if(this.shooters) this.shooters.update(dt);
    this.cam.update(dt);
    if(this.rain) this.rain.update(dt,this.game.camera.position,pl.vx,pl.vz);
    // sun follows player for shadows
    const sun=this.W.sun; sun.position.set(pl.x+this.W.sunDir.x*200,pl.y+this.W.sunDir.y*200,pl.z+this.W.sunDir.z*200); sun.target.position.set(pl.x,pl.y,pl.z); sun.target.updateMatrixWorld();
    // audio
    let near=null; const cp=this.game.camera.position; for(const c of this.cars){ if(c===pl) continue; const d=Math.hypot(c.x-cp.x,c.z-cp.z); if(!near||d<near.d) near={d,v:Math.abs(c.vF)}; }
    this.game.audio.updateCar(pl,near,false);
    this.hudT-=dt; if(this.hudT<=0){ this.hudT=1/15; this.game.ui.hud(this); }
    this.game.ui.minimap(this);
    this.render();
  }
  render(){ const rr_=this.game.renderer; rr_.toneMappingExposure=this.W.th.exposure; rr_.render(this.scene,this.game.camera); }
  simStep(){
    this.time+=DT; const P=this.P, N=P.N; const racing=this.state!=='intro'&&this.state!=='countdown';
    for(const c of this.cars){
      if(!racing){ c.score=((c.pr.i-this.cpIdx[NCP-1]+N)%N); c.inp.thr=0; c.inp.brk=0; c.step(DT); c.vx=c.vz=0; const g=this.W.grid[c.idx]; if(g){ const P=this.P; c.x=P.x[g.i]+P.rx[g.i]*g.lat; c.z=P.z[g.i]+P.rz[g.i]*g.lat; c.h=Math.atan2(P.tx[g.i],P.tz[g.i]); } continue; }
      c.step(DT);
      if(!racing) continue;
      // checkpoints
      const ci=this.cpIdx[c.cp]; const di=(c.pr.i-ci+N)%N;
      if(di<30 && c.pr.i!==undefined){
        c.cp=(c.cp+1)%NCP; c.cpCount++;
        if(c.cp===1){ c.lap++; this.onLap(c); }
      }
      c.score=c.finished?1e9-c.finishPos*1e6:c.cpCount*(N/NCP)+((c.pr.i-this.cpIdx[(c.cp+NCP-1)%NCP]+N)%N);
      // pads
      for(const p of this.W.pads){ const d=((c.pr.i+c.pr.t-p.i)+N+N/2)%N-N/2; if(Math.abs(d*P.spacing)<p.half && Math.abs(c.pr.lat-p.lat)<p.hw && c.grounded){ if(c.boost<0.3){ if(c.isPlayer) this.sfx('pad'); else this.sfx3d('pad',c); } c.giveBoost(1.1); } }
      // item boxes
      for(const b of this.W.items){ if(!b.active) continue; const dx=c.x-b.x,dz=c.z-b.z; if(dx*dx+dz*dz<5.3 && Math.abs(c.y+0.6-b.y)<2.5){ b.active=false; b.t=4; b.grp.visible=false;
        for(let k=0;k<16;k++) this.fx.sparks.emit(b.x,b.y,b.z,rr(-6,6),rr(-2,6),rr(-6,6),0.5,0.4,0.05,1,0.4,0.9,1,3,6);
        if(!c.item){ c.item=this.rollItem(c); c.itemDelay=c.isPlayer?1.0:0.6; if(c.isPlayer){ this.sfx('pickup'); this.game.ui.roulette(); } } } }
      if(c.itemDelay>0){ c.itemDelay-=DT; if(c.isPlayer && c.itemDelay<=0) this.sfx('item'); }
      if(c.inp.item){ c.inp.item=false; if(c.item && c.itemDelay<=0 && !c.finished) this.useItem(c); }
      // slicks
      for(let k=this.slicks.length-1;k>=0;k--){ const s=this.slicks[k]; if(s.owner===c&&s.age<0.8) continue; const dx=c.x-s.x,dz=c.z-s.z; if(dx*dx+dz*dz<3.6 && c.grounded && c.ghost<=0){ const hit=c.spinOut(1.0); if(hit){ if(c.isPlayer){ this.sfx('splat'); this.shake(0.3); this.game.ui.flash('GLAZED!','#ff4fb0'); } else this.sfx3d('splat',c); } this.removeSlick(k); } }
    }
    for(const s of this.slicks) s.age+=DT;
    for(let k=this.slicks.length-1;k>=0;k--) if(this.slicks[k].age>30) this.removeSlick(k);
    this.collide();
    // ranking + rubber band
    { const sorted0=this.cars.slice().sort((a,b)=>b.score-a.score); sorted0.forEach((c,k)=>c.rank=k+1); }
    if(racing){
      const sorted=this.cars.slice().sort((a,b)=>b.score-a.score); sorted.forEach((c,k)=>c.rank=k+1);
      const pl=this.player;
      const rb=DIFFS[this.opt.diff].rb;
      for(const c of this.cars){ if(!c.ai) continue; const dd=(pl.score-c.score)*P.spacing; let r=1;
        if(dd>15) r=1+rb*Math.min(1,(dd-15)/110); else if(dd<-120) r=1-Math.min(0.04,(-dd-120)/2500);
        if(pl.finished) r=1; c.rubber+=(r-c.rubber)*0.004; }
    }
    // wrong way
    const pl=this.player; if(racing && !pl.finished && pl.wrongT>1.2){ this.game.ui.wrong(true); } else this.game.ui.wrong(false);
  }
  onLap(c){
    const now=this.raceTime;
    if(c.lap>1){ const lt=now-c.lapStart; c.lapTimes.push(lt); if(c.bestLap==null||lt<c.bestLap) c.bestLap=lt;
      if(c.isPlayer && !this.game.autopilotNoRecord && (this.best.lap==null||lt<this.best.lap)){ this.best.lap=lt; this.best.lapCar=c.v.name; Store.set('best_'+this.def.id,this.best); this.newLapRecord=true; } }
    c.lapStart=now;
    if(c.lap>this.laps){ c.finished=true; c.finishTime=now; this.finishOrder.push(c); c.finishPos=this.finishOrder.length;
      if(c.isPlayer){ this.state='finish'; this.stateT=0; this.sfx('finish'); this.game.audio.setMusic('menu'); this.game.ui.flash(ordinal(c.finishPos)+' PLACE!',c.finishPos<=3?'#ffc23d':'#22e4ff',3);
        if(this.best.race==null||now<this.best.race){ this.best.race=now; this.best.raceCar=c.v.name; this.newRaceRecord=true; Store.set('best_'+this.def.id,this.best); } }
      return; }
    if(c.isPlayer && c.lap>1){ if(c.lap===this.laps){ this.sfx('final'); this.game.ui.flash('FINAL LAP','#ff2e97'); } else { this.sfx('lap'); this.game.ui.flash('LAP '+c.lap+' / '+this.laps,'#22e4ff'); } }
  }
  rollItem(c){ const r=Math.random(), pos=c.rank/8;
    const wN=0.2+0.6*pos, wA=0.35-0.15*pos, wS=0.45-0.3*pos; const t=wN+wA+wS; const x=r*t; return x<wN?'nitro':x<wN+wA?'aegis':'slick'; }
  useItem(c){
    const it=c.item; c.item=null;
    if(it==='nitro'){ c.giveBoost(1.6); c.boostMax=1.6; if(c.isPlayer) this.sfx('boost',1.2); else this.sfx3d('boost',c); }
    else if(it==='aegis'){ c.shield=7; if(c.isPlayer) this.sfx('shield'); else this.sfx3d('shield',c); }
    else if(it==='slick'){ const fx=Math.sin(c.h),fz=Math.cos(c.h); const x=c.x-fx*(c.halfL+2.2), z=c.z-fz*(c.halfL+2.2); const i=this.P.nearest(x,z,c.i,10); const pr=this.P.project(x,z,i,{});
      if(pr.gap) { c.item=null; return; }
      const m=new THREE.Mesh(this.slickGeo,this.slickMat); m.rotation.x=-Math.PI/2; m.position.set(x,pr.h+0.06,z); m.receiveShadow=true; this.scene.add(m);
      this.slicks.push({x,z,mesh:m,owner:c,age:0}); if(this.slicks.length>12) this.removeSlick(0); if(c.isPlayer) this.sfx('drop'); else this.sfx3d('drop',c); }
  }
  removeSlick(k){ const s=this.slicks[k]; this.scene.remove(s.mesh); this.slicks.splice(k,1); }
  collide(){
    const cs=this.cars;
    for(let a=0;a<cs.length;a++) for(let b=a+1;b<cs.length;b++){
      const A=cs[a],B=cs[b]; if(A.ghost>0||B.ghost>0) continue; if(Math.abs(A.y-B.y)>1.8) continue;
      const dx=B.x-A.x, dz=B.z-A.z, rs=A.radius+B.radius; const d2=dx*dx+dz*dz; if(d2>rs*rs||d2<1e-6) continue;
      const d=Math.sqrt(d2), nx=dx/d, nz=dz/d, pen=rs-d; const ma=A.ph.mass, mb=B.ph.mass, mt=ma+mb;
      A.x-=nx*pen*mb/mt; A.z-=nz*pen*mb/mt; B.x+=nx*pen*ma/mt; B.z+=nz*pen*ma/mt;
      const rv=(B.vx-A.vx)*nx+(B.vz-A.vz)*nz;
      if(rv<0){ const j=-(1.35)*rv/(1/ma+1/mb); A.vx-=j*nx/ma; A.vz-=j*nz/ma; B.vx+=j*nx/mb; B.vz+=j*nz/mb;
        if(A.shield>0&&B.shield<=0&&-rv>3) B.spinOut(0.6); else if(B.shield>0&&A.shield<=0&&-rv>3) A.spinOut(0.6);
        if(-rv>2.5){ const px=A.x+nx*A.radius, pz=A.z+nz*A.radius; if(A.isPlayer||B.isPlayer){ this.sfx('bump'); this.shake(Math.min(0.35,-rv*0.03)); for(let k=0;k<8;k++) this.fx.sparks.emit(px,A.y+0.6,pz,rr(-4,4),rr(1,4),rr(-4,4),0.3,0.25,0.05,1,0.85,0.5,1,2,10);} }
      }
    }
  }
  results(){
    const P=this.P; const list=this.cars.slice();
    const avg=c=>{ return Math.max(20,c.ph.top*c.skill*0.8); };
    list.forEach(c=>{ if(!c.finished){ const remain=(this.laps+1)*P.N - (c.score); c.estTime=this.raceTime+Math.max(0,remain)*P.spacing/avg(c); } else c.estTime=c.finishTime; });
    list.sort((a,b)=>{ if(a.finished&&b.finished) return a.finishPos-b.finishPos; if(a.finished) return -1; if(b.finished) return 1; return a.estTime-b.estTime; });
    return {track:this.def, place:list.indexOf(this.player)+1, rows:list.map((c,k)=>({pos:k+1,driver:c.driver,car:c.v.name,time:c.estTime,est:!c.finished,best:c.bestLap,player:c.isPlayer,color:c.v})),
      finished:this.player.finished, playerTime:this.player.finishTime, playerBest:this.player.bestLap, newRace:!!this.newRaceRecord, newLap:!!this.newLapRecord, best:this.best};
  }
  buildMiniPath(){ const P=this.P; let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9; for(let i=0;i<P.N;i++){minx=Math.min(minx,P.x[i]);maxx=Math.max(maxx,P.x[i]);minz=Math.min(minz,P.z[i]);maxz=Math.max(maxz,P.z[i]);}
    this.mini={minx,maxx,minz,maxz}; }
  dispose(){
    this.game.audio.stopLoops();
    this.scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if(m.map) m.map.dispose(); m.dispose(); }); } });
    if(this.env) this.env.dispose();
  }
}
// ---------- environment map from theme sky ----------
function makeEnvFromTheme(renderer,th){
  const s=new THREE.Scene(); const sg=new THREE.SphereGeometry(45,32,16); const pc=sg.attributes.position; const cols=new Float32Array(pc.count*3); const top=new THREE.Color(th.skyTop), hor=new THREE.Color(th.skyHor), gnd=new THREE.Color(th.hemiG).multiplyScalar(0.5), cc=new THREE.Color();
  for(let v=0;v<pc.count;v++){ const y=pc.getY(v)/45; if(y>=0) cc.copy(hor).lerp(top,Math.pow(y,0.55)); else cc.copy(hor).lerp(gnd,Math.min(1,-y*4)); cols[v*3]=cc.r; cols[v*3+1]=cc.g; cols[v*3+2]=cc.b; }
  sg.setAttribute('color',new THREE.BufferAttribute(cols,3)); s.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  const sd=new THREE.Vector3(...th.sunDir).normalize(); const sunB=new THREE.Mesh(new THREE.SphereGeometry(th.night?2:5,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(th.sunCol).multiplyScalar(th.night?0.5:3)})); sunB.position.copy(sd).multiplyScalar(38); s.add(sunB);
  const g=new THREE.PlaneGeometry(200,200); g.rotateX(-Math.PI/2); const gm=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(th.hemiG).multiplyScalar(0.6)})); gm.position.y=-2; s.add(gm);
  if(th.night){ [0xff2e97,0x22e4ff,0xffc23d].forEach((c,k)=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(30,4),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); p.position.set(Math.cos(k*2.1)*40,6,Math.sin(k*2.1)*40); p.lookAt(0,6,0); s.add(p); }); }
  const pm=new THREE.PMREMGenerator(renderer); const rt=pm.fromScene(s,0.02); pm.dispose(); return rt.texture;
}
// ---------- chase camera ----------
class ChaseCam{
  constructor(R){ this.R=R; this.yaw=R.player.h; this.y=R.player.y+3; this.fov=68; this.snap=true; this.t=0; }
  update(dt){
    const R=this.R, cam=R.game.camera, c=R.player; this.t+=dt;
    if(R.state==='intro'){ // cinematic flyover of the grid
      const k=this.t/4.2, P=R.P, i=(P.N-40+Math.round(k*48))%P.N;
      const side=Math.sin(k*2)*14; { const cx=P.x[i]+P.rx[i]*side, cz=P.z[i]+P.rz[i]*side; cam.position.set(cx,Math.max(P.y[i]+4+10*(1-k),R.W.heightAt(cx,cz)+2),cz); }
      const j=(i+12)%P.N; cam.lookAt(P.x[j],P.y[j]+1,P.z[j]); cam.fov=60; cam.updateProjectionMatrix(); return; }
    if(R.state==='finish'||R.state==='done'){ // orbit the player
      const a=this.t*0.35+c.h+2.5, r=9; const tx=c.x+Math.sin(a)*r, tz=c.z+Math.cos(a)*r; const gy=Math.max(c.y+3.2,R.W.heightAt(tx,tz)+2); cam.position.lerp(new THREE.Vector3(tx,gy,tz),Math.min(1,dt*2)); cam.lookAt(c.x,c.y+1,c.z); cam.fov=lerp(cam.fov,55,dt*2); cam.updateProjectionMatrix(); return; }
    const sp=c.speed;
    let tgtYaw=c.h; if(sp>3){ const vy=Math.atan2(c.vx,c.vz); const fwdDot=Math.sin(c.h)*c.vx+Math.cos(c.h)*c.vz; if(fwdDot>0) tgtYaw=c.h+angDiff(c.h,vy)*0.5; }
    if(this.snap){ this.yaw=tgtYaw; this.y=c.y+2.8; this.snap=false; }
    this.yaw+=angDiff(this.yaw,tgtYaw)*Math.min(1,dt*5.5);
    const tall=Math.max(0,((c.model.dims.H||1.3)-1.4)); const dist=6.6+sp*0.035+tall*1.2, hgt=2.4+sp*0.012+tall*0.7;
    const ty=c.y+hgt; this.y+=(ty-this.y)*Math.min(1,dt*(c.grounded?7:2.5));
    let px=c.x-Math.sin(this.yaw)*dist, pz=c.z-Math.cos(this.yaw)*dist, py=this.y;
    const gh=R.W.heightAt(px,pz); if(py<gh+1.2) py=gh+1.2;
    // shake
    R.trauma=Math.max(0,R.trauma-dt*1.4); let sh=R.trauma*R.trauma; if(R.game.S.shake && c.boost>0) sh+=0.012;
    if(sh>0){ px+=(vnoise(this.t*25,1)-0.5)*sh*1.2; py+=(vnoise(this.t*25,7)-0.5)*sh*1.0; pz+=(vnoise(this.t*25,13)-0.5)*sh*1.2; }
    cam.position.set(px,py,pz);
    cam.lookAt(c.x+Math.sin(this.yaw)*4,c.y+1.1,c.z+Math.cos(this.yaw)*4);
    const tf=66+Math.min(sp,70)*0.22+(c.boost>0?7:0); this.fov+=(tf-this.fov)*Math.min(1,dt*3); cam.fov=this.fov; cam.updateProjectionMatrix();
  }
}

// ===== ONLINE: username/password accounts + Hard-mode leaderboards (Supabase REST) =====
const SB_URL='https://pnnuxsjjdkluphvwknqt.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubnV4c2pqZGtsdXBodndrbnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDg5MjQsImV4cCI6MjEwNTkyNDkyNH0.Y9ZTT5p3k4ND8vpzl2qQniTlltCabEb24c4WdHJnf_8';
const USER_RE=/^[A-Za-z0-9_]{3,16}$/;
class Online{
  constructor(){ this.session=Store.get('session',null); this.listeners=[]; }
  get user(){ return this.session&&this.session.username?this.session.username:null; }
  emailFor(u){ return u.toLowerCase()+'@players.rydensracers.com'; }
  onChange(f){ this.listeners.push(f); } emit(){ this.listeners.forEach(f=>{ try{ f(this.user); }catch(e){} }); }
  async req(path,{method='GET',body,auth=false,headers={}}={}){
    const h=Object.assign({apikey:SB_KEY,'Content-Type':'application/json'},headers);
    if(auth){ await this.ensureFresh(); if(!this.session) throw new Error('Please log in again.'); h.Authorization='Bearer '+this.session.access_token; }
    else h.Authorization='Bearer '+SB_KEY;
    let r; try{ r=await fetch(SB_URL+path,{method,headers:h,body:body!==undefined?JSON.stringify(body):undefined}); }
    catch(e){ throw new Error('Can\u2019t reach the leaderboard server. Online features work on the GitHub version of the game.'); }
    const txt=await r.text(); let data=null; try{ data=txt?JSON.parse(txt):null; }catch(e){ data=txt; }
    if(!r.ok){ const msg=(data&&(data.msg||data.message||data.error_description||data.error))||('Server error '+r.status); const err=new Error(msg); err.status=r.status; err.code=data&&(data.error_code||data.code); throw err; }
    return {data,res:r};
  }
  saveSession(d,username){ this.session={access_token:d.access_token,refresh_token:d.refresh_token,expires_at:Date.now()/1000+(d.expires_in||3600),user_id:d.user&&d.user.id,username}; Store.set('session',this.session); this.emit(); }
  async ensureFresh(){
    const s=this.session; if(!s) return; if(s.expires_at-Date.now()/1000>90) return;
    try{ const {data}=await this.req('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}}); this.saveSession(data,s.username); }
    catch(e){ if(e.status===400||e.status===401){ this.session=null; Store.set('session',null); this.emit(); } throw e; }
  }
  validate(u,p){ if(!USER_RE.test(u||'')) return 'Username must be 3\u201316 letters, numbers or _'; if(!p||p.length<6) return 'Password must be at least 6 characters'; return null; }
  async signUp(u,p){
    const bad=this.validate(u,p); if(bad) throw new Error(bad);
    const {data:free}=await this.req('/rest/v1/rpc/username_available',{method:'POST',body:{name:u}});
    if(free===false) throw new Error('That username is taken.');
    let d; try{ d=(await this.req('/auth/v1/signup',{method:'POST',body:{email:this.emailFor(u),password:p,data:{username:u}}})).data; }
    catch(e){ if(/already registered|already exists/i.test(e.message)) throw new Error('That username is taken.'); if(/database error/i.test(e.message)) throw new Error('That username can\u2019t be used. Try another.'); throw e; }
    if(!d||!d.access_token) throw new Error('Account created, but email confirmation is still switched on in Supabase (Authentication \u2192 Email \u2192 Confirm email).');
    this.saveSession(d,u); return u;
  }
  async logIn(u,p){
    if(!u||!p) throw new Error('Enter your username and password.');
    let d; try{ d=(await this.req('/auth/v1/token?grant_type=password',{method:'POST',body:{email:this.emailFor(u),password:p}})).data; }
    catch(e){ if(e.status===400) throw new Error('Wrong username or password.'); throw e; }
    let name=u; try{ const {data:pr}=await this.req('/rest/v1/profiles?select=username&id=eq.'+d.user.id); if(pr&&pr[0]) name=pr[0].username; }catch(e){}
    this.saveSession(d,name); return name;
  }
  logOut(){ const s=this.session; this.session=null; Store.set('session',null); this.emit(); if(s) fetch(SB_URL+'/auth/v1/logout',{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+s.access_token}}).catch(()=>{}); }
  async submit(track,car,raceMs,lapMs){
    const rows=[]; if(raceMs) rows.push({track,car,kind:'race',time_ms:Math.round(raceMs)}); if(lapMs) rows.push({track,car,kind:'lap',time_ms:Math.round(lapMs)});
    if(!rows.length) return; await this.req('/rest/v1/race_results',{method:'POST',auth:true,body:rows,headers:{Prefer:'return=minimal'}});
  }
  async board(track,kind,limit=10){ const {data}=await this.req(`/rest/v1/leaderboard?select=username,car,time_ms,created_at&track=eq.${track}&kind=eq.${kind}&order=time_ms.asc,created_at.asc&limit=${limit}`); return data||[]; }
  async myBest(track,kind){ if(!this.user) return null; const {data}=await this.req(`/rest/v1/leaderboard?select=username,car,time_ms&track=eq.${track}&kind=eq.${kind}&username=eq.${encodeURIComponent(this.user)}`); return data&&data[0]||null; }
  async rankOf(track,kind,ms){ const {res}=await this.req(`/rest/v1/leaderboard?select=username&track=eq.${track}&kind=eq.${kind}&time_ms=lt.${Math.round(ms)}`,{headers:{Prefer:'count=exact',Range:'0-0'}}); const cr=res.headers.get('content-range')||''; const n=parseInt(cr.split('/')[1]); return isNaN(n)?null:n+1; }
}

// ===== GAME / UI =====
const QUALITY={
  low:{pr:0.75,shadows:false,shadowSize:512,terrainCell:9,density:0.45,fogMul:0.75},
  medium:{pr:1,shadows:true,shadowSize:1024,terrainCell:6,density:0.8,fogMul:1},
  high:{pr:2,shadows:true,shadowSize:2048,terrainCell:5,density:1,fogMul:1.15},
};
const $=id=>document.getElementById(id);
class Input{
  constructor(game){
    this.g=game; this.keys={}; this.touch={}; this.pressed=[]; this.padPrev={};
    addEventListener('keydown',e=>{ if(e.target&&e.target.tagName==='INPUT'){ if(e.code==='Enter'){ const a=game.screen==='account'&&!game.online.user?'login':null; if(a){ e.preventDefault(); game.ui.act(a); } } else if(e.code==='Escape'){ e.target.blur(); } return; } if(e.repeat&&this.keys[e.code]) { this.prevent(e); return; } this.keys[e.code]=true; this.pressed.push(e.code); this.prevent(e); game.onAnyInput(); });
    addEventListener('keyup',e=>{ this.keys[e.code]=false; });
    addEventListener('blur',()=>{ this.keys={}; });
    // ---- touch: floating joystick (left) + multi-touch buttons you can slide/chord between (right) ----
    this.touches=new Map(); this.joy={id:null,x:0,y:0,sx:0,sy:0,steer:0,brake:false};
    const tEl=$('touch'), active=()=>tEl.classList.contains('on');
    const hitButtons=(x,y)=>{ const out=[]; tEl.querySelectorAll('.tb').forEach(b=>{ if(b.offsetParent===null) return; const r=b.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2, R=r.width/2; if(Math.hypot(x-cx,y-cy)<=R*1.22) out.push(b.dataset.k); }); return out; };
    const refresh=()=>{ const on={}; this.touches.forEach(v=>{ if(v.type==='btn') v.keys.forEach(k=>on[k]=true); }); ['gas','brake','drift','item'].forEach(k=>this.touch[k]=!!on[k]); tEl.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',!!on[b.dataset.k])); };
    const joyEl=$('joy'), knob=$('joyK');
    const joyMove=(x,y)=>{ const J=this.joy, R=58; let dx=x-J.sx, dy=y-J.sy; const d=Math.hypot(dx,dy); if(d>R){ dx*=R/d; dy*=R/d; } knob.style.transform=`translate(${dx}px,${dy}px)`;
      let s=dx/R; s=Math.abs(s)<0.1?0:Math.sign(s)*Math.pow((Math.abs(s)-0.1)/0.9,1.15); J.steer=clamp(s,-1,1); J.brake=dy/R>0.6; };
    const start=e=>{ if(!active()) return; let used=false;
      for(const t of e.changedTouches){ if(t.target && t.target.closest && t.target.closest('#pauseBtn')) continue; const x=t.clientX,y=t.clientY; used=true; game.audio.init();
        if(x<innerWidth*0.46 && y>innerHeight*0.28 && this.joy.id===null){ const J=this.joy; J.id=t.identifier; J.sx=x; J.sy=y; joyEl.style.left=x+'px'; joyEl.style.top=y+'px'; joyEl.classList.add('on'); joyMove(x,y); this.touches.set(t.identifier,{type:'joy'}); }
        else this.touches.set(t.identifier,{type:'btn',keys:hitButtons(x,y)}); }
      if(used){ e.preventDefault(); refresh(); } };
    const move=e=>{ if(!active()||!this.touches.size) return; let used=false;
      for(const t of e.changedTouches){ const v=this.touches.get(t.identifier); if(!v) continue; used=true; if(v.type==='joy') joyMove(t.clientX,t.clientY); else v.keys=hitButtons(t.clientX,t.clientY); }
      if(used){ e.preventDefault(); refresh(); } };
    const end=e=>{ let used=false; for(const t of e.changedTouches){ const v=this.touches.get(t.identifier); if(!v) continue; used=true; this.touches.delete(t.identifier);
        if(v.type==='joy'){ const J=this.joy; J.id=null; J.steer=0; J.brake=false; knob.style.transform=''; joyEl.classList.remove('on'); joyEl.style.left=''; joyEl.style.top=''; } }
      if(used){ if(e.cancelable) e.preventDefault(); refresh(); } };
    document.addEventListener('touchstart',start,{passive:false}); document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',end,{passive:false}); document.addEventListener('touchcancel',end,{passive:false});
    this.clearTouch=()=>{ this.touches.clear(); const J=this.joy; J.id=null; J.steer=0; J.brake=false; knob.style.transform=''; joyEl.classList.remove('on'); refresh(); };
  }
  prevent(e){ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(e.code)) e.preventDefault(); }
  pad(){ const ps=navigator.getGamepads?navigator.getGamepads():[]; for(const p of ps){ if(p&&p.connected) return p; } return null; }
  // edge-triggered menu events
  events(){
    const ev=this.pressed.slice(); this.pressed.length=0;
    const p=this.pad(); if(p){ const b=i=>p.buttons[i]&&p.buttons[i].pressed; const map={up:b(12)||p.axes[1]<-0.6,down:b(13)||p.axes[1]>0.6,left:b(14)||p.axes[0]<-0.6,right:b(15)||p.axes[0]>0.6,ok:b(0),back:b(1),start:b(9),sel:b(8)};
      const codes={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',ok:'Enter',back:'Escape',start:'PadStart',sel:'PadSelect'};
      for(const k in map){ if(map[k]&&!this.padPrev[k]){ ev.push(codes[k]); this.g.onAnyInput(); } this.padPrev[k]=map[k]; } }
    return ev;
  }
  drive(){
    const K=this.keys,T=this.touch; const o={thr:0,brk:0,steer:0,drift:false,item:false,reset:false,skip:false};
    const J=this.joy||{steer:0,brake:false};
    if(K.KeyW||K.ArrowUp||T.gas) o.thr=1; if(K.KeyS||K.ArrowDown||T.brake||J.brake) o.brk=1;
    if(K.KeyA||K.ArrowLeft) o.steer-=1; if(K.KeyD||K.ArrowRight) o.steer+=1; if(J.steer) o.steer=clamp(o.steer+J.steer,-1,1);
    const R=this.g.race; if(this.g.S.autogas && this.g.ui.isTouch() && !o.brk && R && R.state!=='intro' && R.state!=='countdown') o.thr=1;
    o.drift=!!(K.Space||T.drift); o.item=!!(K.ShiftLeft||K.ShiftRight||K.KeyE||T.item); o.reset=!!K.KeyR;
    const p=this.pad(); if(p){ const ax=p.axes[0]||0; if(Math.abs(ax)>0.15) o.steer=clamp(o.steer+Math.sign(ax)*(Math.abs(ax)-0.15)/0.85,-1,1);
      const bv=i=>p.buttons[i]?(p.buttons[i].value||(p.buttons[i].pressed?1:0)):0;
      o.thr=Math.max(o.thr,bv(7),bv(0)); o.brk=Math.max(o.brk,bv(6),bv(1)); if(bv(5)>0.5||bv(2)>0.5) o.drift=true; if(bv(4)>0.5||bv(3)>0.5) o.item=true; if(bv(8)>0.5) o.reset=true; }
    return o;
  }
}
class Game{
  constructor(){
    this.S=Object.assign({master:0.8,sfx:0.9,music:0.6,musicOn:true,quality:'medium',shake:true,units:'mph',touch:'auto',autogas:true},Store.get('settings',{}));
    this.sel={vehicle:Store.get('lastCar',2),track:Store.get('lastTrack',0),diff:Store.get('lastDiff','normal')};
    const canvas=$('gl'); this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    const r=this.renderer; r.outputEncoding=THREE.sRGBEncoding; r.toneMapping=THREE.ACESFilmicToneMapping; r.shadowMap.type=THREE.PCFSoftShadowMap;
    this.camera=new THREE.PerspectiveCamera(66,1,0.1,3200);
    this.online=new Online(); this.audio=new AudioEngine(this.S); this.input=new Input(this); this.ui=new UI(this);
    this.applyQuality(); addEventListener('resize',()=>this.resize()); this.resize();
    this.garage=new Garage(this); this.race=null; this.screen='title'; this.focus=0; this.last=performance.now();
    this.fps=60; this.frames=0; this.fpsT=0;
    const loop=()=>{ requestAnimationFrame(loop); this.frame(); }; requestAnimationFrame(loop);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden && this.race && this.screen==='race') this.pause(true); });
  }
  get Q(){ return QUALITY[this.S.quality]||QUALITY.medium; }
  applyQuality(){ const Q=this.Q; this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,Q.pr)); this.renderer.shadowMap.enabled=Q.shadows; this.resize(); }
  resize(){ const w=innerWidth,h=innerHeight; this.renderer.setSize(w,h,false); this.camera.aspect=w/h; this.camera.updateProjectionMatrix(); }
  saveSettings(){ Store.set('settings',this.S); this.audio.apply(); this.ui.touchMode(); }
  onAnyInput(){ this.audio.init(); if(this.screen==='title'){ this.audio.play('select'); this.show('menu'); this.swallow=true; } }
  show(name){
    this.screen=name; document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===name));
    this.focus=0; this.ui.enter(name); this.ui.refocus();
  }
  frame(){
    const now=performance.now(); let dt=(now-this.last)/1000; this.last=now; if(dt>0.25) dt=0.25;
    this.frames++; this.fpsT+=dt; if(this.fpsT>=1){ this.fps=this.frames/this.fpsT; this.frames=0; this.fpsT=0; }
    let ev=this.input.events(); if(this.swallow){ ev=[]; this.swallow=false; }
    if(this.race && (this.screen==='race'||this.screen==='pause'||this.screen==='results'||(this.screen==='settings'&&this.fromPause))){
      if(this.screen==='race'){ const k=ev.findIndex(e=>e==='Escape'||e==='KeyP'||e==='PadStart'); if(k>=0){ this.pause(true); this.ui.menuEvents(ev.slice(k+1)); } }
      else this.ui.menuEvents(ev);
      if(!this.race){ this.garage.update(dt); this.garage.render(); return; }
      const inp=this.input.drive(); inp.skip=this.screen==='race'&&ev.length>0&&this.race.state==='intro';
      this.race.update(dt,this.screen==='race'?inp:{thr:0,brk:0,steer:0,drift:false,item:false,reset:false});
      return;
    }
    this.ui.menuEvents(ev);
    this.garage.update(dt); this.garage.render();
  }
  pause(on){ if(!this.race) return; this.race.paused=on; if(on){ this.show('pause'); $('hud').classList.remove('on'); this.audio.play('blip'); } else { this.show('race'); $('hud').classList.add('on'); } }
  startRace(){
    if(this.gp){ this.sel.track=TRACK_DATA.findIndex(t=>t.id===GP_TRACKS[this.gp.round]); this.sel.diff=this.gp.diff; }
    else { Store.set('lastCar',this.sel.vehicle); Store.set('lastTrack',this.sel.track); Store.set('lastDiff',this.sel.diff); }
    const def=TRACK_DATA[this.sel.track]; $('loadName').textContent=def.name; $('loadPlace').textContent=def.place;
    this.show('loading'); this.garage.render();
    setTimeout(()=>{
      try{
        if(this.race){ this.race.dispose(); this.race=null; }
        this.race=new Race(this,{track:this.sel.track,vehicle:this.sel.vehicle,diff:this.sel.diff,field:this.gp?this.gp.field:null});
        this.show('race'); $('hud').classList.add('on');
      }catch(e){ this.ui.error(e); console.error(e); this.show('menu'); }
    },60);
  }
  endRace(){ if(this.race){ this.race.dispose(); this.race=null; } $('hud').classList.remove('on'); this.audio.setMusic('menu'); this.ui.touchVisible(false); }
  showResults(res){ $('hud').classList.remove('on'); this.ui.results(res); if(this.gp) this.gpAfterRace(res); else { $('resGP').style.display='none'; $('resBtnsGP').style.display='none'; $('resBtns').style.display=''; } this.show('results'); this.postOnline(res); }
  gpAfterRace(res){
    const gp=this.gp, r=gp.round, last=r===GP_TRACKS.length-1; const rows=res.rows; const el=$('resGP'), bt=$('resBtnsGP');
    $('resBtns').style.display='none'; el.style.display='block'; bt.style.display='flex';
    let html=`<div class="gpt">GRAND PRIX · RACE ${r+1} OF ${GP_TRACKS.length}</div>`, btns='';
    if(last){
      const win=rows[0]; gp.done=true;
      if(win.player){ html=`<div class="gpt" style="font-size:30px">🏆 GRAND PRIX CHAMPION! 🏆</div><div class="gpn">You won all the way through with the ${VEHICLES[this.sel.vehicle].name}.</div>`; this.audio.play('finish'); }
      else html+=`<div class="gpo">${esc(win.driver)} wins the Grand Prix in the ${esc(win.car)}. You finished ${ordinal(rows.findIndex(x=>x.player)+1)} in the final.</div>`;
      btns=`<div class="btn small gold" data-gp="new"><span>New Grand Prix</span></div><div class="btn small" data-gp="quit"><span>Main menu</span></div>`;
    } else {
      const k=GP_ELIM[r]; const out=rows.slice(rows.length-k); const meOut=out.some(x=>x.player);
      html+=`<div class="gpo">Eliminated: ${out.map(x=>x.player?'<b>YOU</b>':esc(x.driver)+' ('+esc(x.car)+')').join(', ')}</div>`;
      if(meOut){ gp.done=true; html+=`<div class="gpn">Your Grand Prix is over. Finish higher to survive the cut.</div>`; btns=`<div class="btn small gold" data-gp="new"><span>Try again</span></div><div class="btn small" data-gp="quit"><span>Main menu</span></div>`; }
      else { gp.field=rows.slice(0,rows.length-k).filter(x=>!x.player).map(x=>x.color.id); gp.round++; const nt=TRACK_DATA.find(t=>t.id===GP_TRACKS[gp.round]);
        html+=`<div class="gpn">You survive! Next: <b>${nt.name}</b> with ${gp.field.length+1} racers${gp.round===GP_TRACKS.length-1?' · FINAL':''}.</div>`;
        btns=`<div class="btn small gold" data-gp="next"><span>${gp.round===GP_TRACKS.length-1?'Start the final':'Next race'}</span></div><div class="btn small" data-gp="quit"><span>Quit Grand Prix</span></div>`; }
    }
    el.innerHTML=html; bt.innerHTML=btns;
    bt.querySelectorAll('[data-gp]').forEach(b=>b.addEventListener('click',()=>this.ui.act('gp_'+b.dataset.gp)));
  }
  newGP(){ const others=VEHICLES.filter((v,i)=>i!==this.sel.vehicle).map(v=>v.id).sort(()=>Math.random()-0.5); this.gp={round:0,diff:this.sel.diff,field:others.slice(0,7)}; this.startRace(); }
  async postOnline(res){
    const el=$('resOnline'); el.className='msg'; el.textContent='';
    if(!res.finished || res.posted) return; res.posted=true;
    if(this.sel.diff!=='hard'){ el.textContent='Leaderboards count Hard difficulty only.'; return; }
    if(!this.online.user){ el.textContent='Log in from the main menu to post Hard times to the leaderboards.'; return; }
    if(this.autopilot){ return; }
    const tr=res.track.id, car=VEHICLES[this.sel.vehicle].id;
    el.textContent='Posting to leaderboards…';
    try{
      await this.online.submit(tr,car,res.playerTime*1000,res.playerBest?res.playerBest*1000:null);
      const [rr,lr]=await Promise.all([this.online.rankOf(tr,'race',res.playerTime*1000),res.playerBest?this.online.rankOf(tr,'lap',res.playerBest*1000):null]);
      el.innerHTML=`Posted as <b>${this.online.user}</b> · this race would rank <b>#${rr||'?'}</b>`+(lr?` · best lap <b>#${lr}</b>`:'')+' on the online board';
    }catch(e){ el.className='msg bad'; el.textContent='Couldn’t post to leaderboards: '+e.message; }
  }
}
// ---------------- neon garage (menu backdrop + showroom) ----------------
class Garage{
  constructor(game){
    this.g=game; const s=this.scene=new THREE.Scene(); s.background=new THREE.Color(0x0b0520); s.fog=new THREE.Fog(0x0b0520,20,60);
    s.add(new THREE.HemisphereLight(0x8a6cff,0x1a0830,0.35));
    const key=new THREE.SpotLight(0xffffff,2.2,40,0.6,0.5,1.2); key.position.set(3,11,6); key.castShadow=true; key.shadow.mapSize.set(1024,1024); s.add(key); s.add(key.target);
    const pink=new THREE.PointLight(0xff2e97,2.2,30); pink.position.set(-7,4,-2); s.add(pink);
    const cyan=new THREE.PointLight(0x22e4ff,2.0,30); cyan.position.set(7,4,-2); s.add(cyan);
    // splatter floor
    const ft=canvasTex(1024,1024,(g,w,h)=>{ noiseFill(g,w,h,'#17102a',18); const cs=['#ff2e97','#22e4ff','#ffc23d','#9b1cff','#ffffff'];
      for(let k=0;k<70;k++){ g.fillStyle=cs[k%5]; g.globalAlpha=0.35+Math.random()*0.4; const x=Math.random()*w,y=Math.random()*h,r=6+Math.random()*34; g.beginPath(); g.arc(x,y,r,0,TAU); g.fill();
        for(let d=0;d<10;d++){ const a=Math.random()*TAU,l=r+Math.random()*60; g.beginPath(); g.arc(x+Math.cos(a)*l,y+Math.sin(a)*l,1+Math.random()*5,0,TAU); g.fill(); } } g.globalAlpha=1; },{repeat:true});
    ft.repeat.set(3,3);
    const floor=new THREE.Mesh(new THREE.CircleGeometry(40,48),new THREE.MeshStandardMaterial({map:ft,roughness:0.35,metalness:0.2})); floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; s.add(floor);
    const tt=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.4,0.18,48),new THREE.MeshStandardMaterial({color:0x1d1233,metalness:0.7,roughness:0.3})); tt.position.y=0.09; tt.receiveShadow=true; s.add(tt);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(4.3,0.05,8,64),new THREE.MeshBasicMaterial({color:0xff2e97})); ring.rotation.x=Math.PI/2; ring.position.y=0.18; s.add(ring);
    // back walls with neon tubes
    const wallM=new THREE.MeshStandardMaterial({color:0x0a0514,roughness:0.95});
    for(let k=0;k<6;k++){ const a=-Math.PI*0.75+k*Math.PI*0.3; const w=new THREE.Mesh(new THREE.PlaneGeometry(12,10),wallM); w.position.set(Math.sin(a)*16,5,-Math.cos(a)*16); w.lookAt(0,5,0); s.add(w);
      [2.2,7.8].forEach((y,j)=>{ const tube=new THREE.Mesh(new THREE.BoxGeometry(11,0.12,0.12),new THREE.MeshBasicMaterial({color:(k+j)%2?0xff2e97:0x22e4ff})); tube.position.copy(w.position).multiplyScalar(0.98); tube.position.y=y; tube.lookAt(0,y,0); s.add(tube); }); }
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(10,3.4),new THREE.MeshBasicMaterial({map:textPanelTex([{text:"Ryden's",font:'150px Yellowtail, cursive',color:'#ff4fb0',glow:'#ff2e97',y:0.5}],{w:1024,h:350,bg:'rgba(0,0,0,0)'}),transparent:true}));
    sign.position.set(0,6.8,-15.5); s.add(sign);
    // env for car reflections
    const es=new THREE.Scene(); es.background=new THREE.Color(0x0b0520);
    [[0xff2e97,-8],[0x22e4ff,8],[0xffffff,0]].forEach(([c,x])=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(x?4:14,x?14:3),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide})); p.position.set(x,x?3:10,x?0:0); p.lookAt(0,1,0); es.add(p); });
    const pm=new THREE.PMREMGenerator(game.renderer); this.env=pm.fromScene(es,0.03).texture; pm.dispose();
    this.turn=new THREE.Group(); this.turn.position.y=0.18; s.add(this.turn); this.carIdx=-1; this.models={}; this.t=0; this.spin=0.4; this.drag=null;
    this.cam=new THREE.PerspectiveCamera(40,1,0.1,200);
    this.setCar(game.sel.vehicle);
    const cv=$('gl'); cv.addEventListener('pointerdown',e=>{ if(this.g.screen==='garage') this.drag=e.clientX; }); addEventListener('pointermove',e=>{ if(this.drag!=null){ this.spin=0; this.turn.rotation.y+=(e.clientX-this.drag)*0.01; this.drag=e.clientX; } }); addEventListener('pointerup',()=>{ if(this.drag!=null){ this.drag=null; this.spin=0.4; } });
  }
  setCar(i){ if(this.carIdx===i) return; this.carIdx=i; this.turn.children.slice().forEach(c=>this.turn.remove(c));
    if(!this.models[i]){ setEnvOnCarMats(this.env); const m=buildCarModel(VEHICLES[i],this.env); m.root.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); this.models[i]=m; }
    const m=this.models[i]; this.turn.add(m.root); this.pop=0; }
  update(dt){
    this.t+=dt; this.turn.rotation.y+=this.spin*dt; this.pop=Math.min(1,this.pop+dt*3); const k=1-Math.pow(1-this.pop,3); this.turn.scale.setScalar(0.7+0.3*k);
    const m=this.models[this.carIdx]; if(m&&m.anims) m.anims.forEach(f=>f(dt,this.t,null)); if(m&&m.lightbar){ const f=Math.sin(this.t*12)>0; m.lightbar.red.color.setHex(f?0xff1030:0x300008); m.lightbar.blue.color.setHex(f?0x10103a:0x1a55ff); }
    const scr=this.g.screen; const aspect=innerWidth/innerHeight; this.cam.aspect=aspect;
    let tx,ty,tz,lx=0;
    if(scr==='garage'){ tx=aspect>1.1?-2.2:0; ty=2.6; tz=10.5+(aspect<1?5:0); lx=aspect>1.1?-2.6:0; }
    else { const a=this.t*0.12; tx=Math.sin(a)*12; ty=4+Math.sin(this.t*0.3); tz=Math.cos(a)*12; }
    const tgt=new THREE.Vector3(tx,ty,tz); this.cam.position.lerp(tgt,Math.min(1,dt*2.5));
    this.cam.lookAt(lx,scr==='garage'?0.9:2.6,0); this.cam.fov=aspect<1?52:40; this.cam.updateProjectionMatrix();
    if(this.g.renderer.shadowMap.enabled!==true){} 
  }
  render(){ const r=this.g.renderer; r.toneMappingExposure=1.1; r.render(this.scene,this.cam); }
}
// ---------------- UI (menus + HUD) ----------------
class UI{
  constructor(g){
    this.g=g; this.miniCtx=$('mini').getContext('2d'); this.touchMode();
    document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{ this.g.audio.init(); this.act(b.dataset.act); }));
    $('title').addEventListener('pointerdown',()=>{ this.g.onAnyInput(); });
    $('diffSeg').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ this.g.sel.diff=b.dataset.d; this.g.audio.play('blip'); this.diffUI(); }));
    $('pauseBtn').addEventListener('click',()=>this.g.pause(true));
    // settings wiring
    document.querySelectorAll('#settings input[type=range]').forEach(inp=>{ const k=inp.dataset.s; inp.value=g.S[k]; const lab=inp.nextElementSibling; lab.textContent=Math.round(g.S[k]*100);
      inp.addEventListener('input',()=>{ g.S[k]=+inp.value; lab.textContent=Math.round(g.S[k]*100); g.saveSettings(); }); });
    document.querySelectorAll('#settings .seg').forEach(seg=>{ const k=seg.dataset.t; seg.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ let v=b.dataset.v; if(k==='musicOn'||k==='shake'||k==='autogas') v=v==='1'; g.S[k]=v; g.audio.init(); g.audio.play('blip'); if(k==='quality') g.applyQuality(); g.saveSettings(); this.settingsUI(); })); });
    this.settingsUI(); this.buildTracks(); this.carDots(); g.online.onChange(()=>this.acctUI()); this.acctUI();
    this.lastItem=null; this.rollT=0;
    if('ontouchstart' in window) $('pressTxt').textContent='Tap to start';
  }
  error(e){ const el=$('err'); el.style.display='block'; el.textContent='Error: '+(e&&e.message||e); }
  isTouch(){ const t=this.g.S.touch; return t==='on'||(t==='auto'&&(('ontouchstart' in window)||navigator.maxTouchPoints>0)&&matchMedia('(pointer:coarse)').matches); }
  touchMode(){ document.body.classList.toggle('touch',this.isTouch()); document.body.classList.toggle('autogas',!!this.g.S.autogas); }
  touchVisible(on){ $('touch').classList.toggle('on',on&&this.isTouch()); if(!on&&this.g.input&&this.g.input.clearTouch) this.g.input.clearTouch(); }
  settingsUI(){ const S=this.g.S; document.querySelectorAll('#settings .seg').forEach(seg=>{ const k=seg.dataset.t; seg.querySelectorAll('button').forEach(b=>{ let v=b.dataset.v; if(k==='musicOn'||k==='shake'||k==='autogas') v=v==='1'; b.classList.toggle('on',S[k]===v); }); }); }
  diffUI(){ $('diffSeg').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.d===this.g.sel.diff)); }
  items(){ return [...document.querySelectorAll('.screen.on .btn, .screen.on .tcard, .screen.on .arrow')].filter(b=>b.offsetParent!==null&&!b.classList.contains('arrow')); }
  refocus(){ const it=this.items(); it.forEach((b,k)=>b.classList.toggle('focus',k===this.g.focus)); }
  enter(name){
    const g=this.g;
    if(name==='garage'){ g.garage.setCar(g.sel.vehicle); this.carInfo(); g.focus=1; }
    if(name==='trackSel'){ this.buildTracks(); this.diffUI(); g.focus=g.sel.track; }
    if(name==='records') this.records();
    if(name==='gpIntro') this.gpIntroUI();
    if(name==='account'){ this.acctUI(); $('acctMsg').textContent=''; if(!this.g.online.user) setTimeout(()=>{ if(!this.isTouch()) $('aUser').focus(); },50); }
    if(name==='boards'){ this.buildBoardTabs(); this.loadBoard(); }
    $('acctTag').style.display=(name==='menu'||name==='title')&&this.g.online.user?'block':'none';
    if(name==='settings'){ this.settingsUI(); document.querySelectorAll('#settings input[type=range]').forEach(inp=>{ inp.value=g.S[inp.dataset.s]; inp.nextElementSibling.textContent=Math.round(g.S[inp.dataset.s]*100); }); }
    this.touchVisible(name==='race'); document.body.classList.toggle('racing',name==='race');
    $('pauseBtn').style.display=(name==='race'&&this.isTouch())?'block':'none';
  }
  menuEvents(ev){
    const g=this.g; if(!ev.length) return; const it=this.items(); const scr=g.screen;
    for(const e of ev){
      if(scr==='title'||scr==='loading') continue;
      if(scr==='garage'&&(e==='ArrowLeft'||e==='KeyA')){ this.act('prevCar'); continue; }
      if(scr==='garage'&&(e==='ArrowRight'||e==='KeyD')){ this.act('nextCar'); continue; }
      if(scr==='trackSel'&&(e==='ArrowUp'||e==='ArrowDown')&&g.focus<TRACK_DATA.length){ const d=['easy','normal','hard']; let k=d.indexOf(g.sel.diff)+(e==='ArrowUp'?1:-1); g.sel.diff=d[clamp(k,0,2)]; this.diffUI(); g.audio.play('blip'); continue; }
      if(scr==='settings'&&(e==='ArrowLeft'||e==='ArrowRight')) continue;
      if(['ArrowDown','ArrowRight','KeyS','KeyD','Tab'].includes(e)){ g.focus=(g.focus+1)%it.length; g.audio.play('blip'); }
      else if(['ArrowUp','ArrowLeft','KeyW','KeyA'].includes(e)){ g.focus=(g.focus-1+it.length)%it.length; g.audio.play('blip'); }
      else if(e==='Enter'||e==='Space'||e==='NumpadEnter'){ const b=it[g.focus]; if(b){ if(b.classList.contains('tcard')){ g.sel.track=+b.dataset.i; g.audio.play('select'); this.act('go'); } else b.click(); } }
      else if(e==='Escape'||e==='Backspace'){ if(scr==='pause') this.act('resume'); else if(scr!=='menu'&&scr!=='results') this.act('back'); }
      else if(e==='PadStart'&&scr==='pause') this.act('resume');
      this.refocus();
    }
  }
  act(a){
    const g=this.g, au=g.audio;
    switch(a){
      case 'race': au.play('select'); g.mode='single'; g.gp=null; g.show('garage'); break;
      case 'gp': au.play('select'); g.mode='gp'; g.gp=null; g.show('garage'); break;
      case 'gpBack': au.play('back'); g.show('garage'); break;
      case 'gpStart': au.play('select'); g.newGP(); break;
      case 'gp_next': au.play('select'); g.startRace(); break;
      case 'gp_new': au.play('select'); g.endRace(); g.newGP(); break;
      case 'gp_quit': au.play('back'); g.gp=null; g.mode='single'; g.endRace(); g.show('menu'); break;
      case 'settings': au.play('select'); g.fromPause=g.screen==='pause'; g.show('settings'); break;
      case 'howto': au.play('select'); g.show('howto'); break;
      case 'records': au.play('select'); g.show('records'); break;
      case 'clearRec': TRACK_DATA.forEach(t=>Store.set('best_'+t.id,{race:null,lap:null})); this.records(); au.play('back'); break;
      case 'back': au.play('back');
        if(g.screen==='settings'&&g.fromPause){ g.fromPause=false; g.show('pause'); break; }
        g.show(g.screen==='trackSel'?'garage':'menu'); break;
      case 'prevCar': g.sel.vehicle=(g.sel.vehicle+VEHICLES.length-1)%VEHICLES.length; g.garage.setCar(g.sel.vehicle); this.carInfo(); au.play('blip'); break;
      case 'nextCar': g.sel.vehicle=(g.sel.vehicle+1)%VEHICLES.length; g.garage.setCar(g.sel.vehicle); this.carInfo(); au.play('blip'); break;
      case 'pickCar': au.play('select'); g.show(g.mode==='gp'?'gpIntro':'trackSel'); break;
      case 'go': au.play('select'); g.startRace(); break;
      case 'resume': au.play('select'); g.pause(false); break;
      case 'restart': au.play('select'); g.startRace(); break;
      case 'changeTrack': au.play('select'); g.gp=null; g.mode='single'; g.endRace(); g.show('trackSel'); break;
      case 'changeCar': au.play('select'); g.gp=null; g.mode='single'; g.endRace(); g.show('garage'); break;
      case 'quit': au.play('back'); g.gp=null; g.mode='single'; g.endRace(); g.show('menu'); break;
      case 'account': au.play('select'); g.show('account'); break;
      case 'boards': au.play('select'); g.show('boards'); break;
      case 'refreshBoards': au.play('blip'); this.loadBoard(); break;
      case 'login': case 'signup': this.doAuth(a); break;
      case 'logout': au.play('back'); g.online.logOut(); this.acctUI(); break;
    }
  }
  acctUI(){ const u=this.g.online.user; $('acctIn').style.display=u?'none':'block'; $('acctOut').style.display=u?'block':'none'; $('acctName').textContent=u||'';
    $('acctBtn').firstElementChild.textContent=u?'Account':'Log in'; $('acctTag').innerHTML=u?'Racing as <b>'+u+'</b>':''; }
  async doAuth(kind){
    const g=this.g, m=$('acctMsg'), u=$('aUser').value.trim(), p=$('aPass').value; if(this.busy) return; this.busy=true;
    m.className='msg'; m.textContent=kind==='signup'?'Creating account…':'Logging in…';
    try{ const name=kind==='signup'?await g.online.signUp(u,p):await g.online.logIn(u,p); $('aPass').value=''; g.audio.play('select'); this.acctUI(); m.textContent=(kind==='signup'?'Account created. ':'')+'Welcome, '+name+'!'; }
    catch(e){ g.audio.play('back'); m.className='msg bad'; m.textContent=e.message; }
    this.busy=false;
  }
  buildBoardTabs(){ if(this.bSel==null) this.bSel={track:TRACK_DATA[this.g.sel.track].id,kind:'race'}; const el=$('bTracks');
    el.innerHTML=TRACK_DATA.map(t=>`<button data-t="${t.id}" class="${t.id===this.bSel.track?'on':''}">${t.name}</button>`).join('');
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{ this.bSel.track=b.dataset.t; this.g.audio.play('blip'); this.buildBoardTabs(); this.loadBoard(); });
    $('bKind').querySelectorAll('button').forEach(b=>{ b.classList.toggle('on',b.dataset.k===this.bSel.kind); b.onclick=()=>{ this.bSel.kind=b.dataset.k; this.g.audio.play('blip'); this.buildBoardTabs(); this.loadBoard(); }; }); }
  async loadBoard(){
    const {track,kind}=this.bSel||{track:'sweet',kind:'race'}, tb=$('bTable'), m=$('bMsg'), on=this.g.online; const req=this.boardReq=(this.boardReq||0)+1;
    tb.innerHTML=''; m.className='msg'; m.textContent='Loading…';
    try{ const rows=await on.board(track,kind,10); if(req!==this.boardReq) return;
      const carName=id=>(VEHICLES.find(v=>v.id===id)||{name:id}).name;
      tb.innerHTML=rows.map((r,k)=>`<tr class="${r.username===on.user?'me':''}"><td class="p">${k+1}</td><td>${esc(r.username)}</td><td style="color:var(--dim)">${carName(r.car)}</td><td class="t">${fmtTime(r.time_ms/1000)}</td></tr>`).join('');
      m.textContent=rows.length?'':'No times yet. Finish a race on Hard to set the first record!';
      if(on.user && !rows.some(r=>r.username===on.user)){ const mine=await on.myBest(track,kind); if(mine&&req===this.boardReq){ const rk=await on.rankOf(track,kind,mine.time_ms); m.innerHTML=`Your best: <b>${fmtTime(mine.time_ms/1000)}</b> in the ${carName(mine.car)} · rank #${rk}`; } }
    }catch(e){ if(req!==this.boardReq) return; m.className='msg bad'; m.textContent=e.message; }
  }
  gpIntroUI(){ const g=this.g; const sizes=[8]; GP_ELIM.forEach((k,i)=>sizes.push(sizes[i]-k));
    $('gpRounds').innerHTML=GP_TRACKS.map((id,i)=>{ const t=TRACK_DATA.find(x=>x.id===id); return `<div class="gpr"><div class="n">Race ${i+1}${i===GP_TRACKS.length-1?' · Final':''}</div><canvas width="300" height="240"></canvas><h3>${t.name}</h3><div class="f">${sizes[i]} racers${i<GP_ELIM.length?' · '+GP_ELIM[i]+' knocked out':' · winner takes all'}</div></div>`; }).join('');
    $('gpRounds').querySelectorAll('canvas').forEach((cv,i)=>drawTrackThumb(cv,TRACK_DATA.find(x=>x.id===GP_TRACKS[i])));
    $('gpDiff').querySelectorAll('button').forEach(b=>{ b.classList.toggle('on',b.dataset.d===g.sel.diff); b.onclick=()=>{ g.sel.diff=b.dataset.d; g.audio.play('blip'); this.gpIntroUI(); }; }); }
  carDots(){ $('carDots').innerHTML=VEHICLES.map(()=>'<b></b>').join(''); }
  carInfo(){
    const v=VEHICLES[this.g.sel.vehicle], s=v.stats;
    const bars=[['Speed',s.speed],['Accel',s.accel],['Handling',s.handling],['Drift',s.drift],['Weight',s.weight]].map(([n,x])=>`<div class="stat"><span>${n}</span><div class="bar"><i style="width:${x*10}%"></i></div></div>`).join('');
    $('carInfo').innerHTML=`<div class="cls">${v.cls} · Driver: ${v.driver}</div><h2>${v.name}</h2><div class="tag">${v.tag}</div><div class="desc">${v.desc}</div><div style="margin-top:12px">${bars}</div>`;
    [...$('carDots').children].forEach((d,k)=>d.classList.toggle('on',k===this.g.sel.vehicle));
  }
  buildTracks(){
    const el=$('tracks'); el.innerHTML='';
    TRACK_DATA.forEach((t,i)=>{ const b=Store.get('best_'+t.id,{});
      const d=document.createElement('div'); d.className='tcard'; d.dataset.i=i;
      d.innerHTML=`<canvas width="300" height="240"></canvas><div class="pl">${t.place}</div><h3>${t.name}${t.hard?' <span style="color:#ff3b3b;font-size:12px;letter-spacing:.1em">HARDEST</span>':''}</h3><p>${t.blurb}</p><div class="rec">BEST RACE ${fmtTime(b.race)}<br>BEST LAP ${fmtTime(b.lap)}</div>`;
      d.addEventListener('click',()=>{ this.g.sel.track=i; this.g.focus=i; this.g.audio.play('blip'); this.refocus(); this.markTrack(); });
      d.addEventListener('dblclick',()=>{ this.g.sel.track=i; this.act('go'); });
      el.appendChild(d); drawTrackThumb(d.querySelector('canvas'),t); });
    this.markTrack();
  }
  markTrack(){ document.querySelectorAll('.tcard').forEach((c,k)=>c.style.outline=k===this.g.sel.track?'3px solid var(--gold)':'none'); }
  records(){
    $('recList').innerHTML=TRACK_DATA.map(t=>{ const b=Store.get('best_'+t.id,{}); return `<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.08)"><div><div style="font-family:var(--disp);font-size:20px;font-style:italic">${t.name}</div><div class="hint" style="margin:0;text-align:left">${t.place}</div></div><div style="text-align:right;font-size:13px;letter-spacing:.06em"><div>RACE <b style="color:var(--gold)">${fmtTime(b.race)}</b> <span style="color:var(--dim)">${b.raceCar||''}</span></div><div>LAP <b style="color:var(--cyan)">${fmtTime(b.lap)}</b> <span style="color:var(--dim)">${b.lapCar||''}</span></div></div></div>`; }).join('');
  }
  // ---------- race HUD ----------
  raceStart(R){ $('miniName').textContent=R.def.name; $('icName').textContent=R.def.name; $('icPlace').textContent=R.def.place; this.introCard(true); $('hUnit').textContent=this.g.S.units==='mph'?'MPH':'KM/H';
    const m=R.mini; const pad=18, W=340; const sc=(W-pad*2)/Math.max(m.maxx-m.minx,m.maxz-m.minz); this.miniT={sc,ox:W/2-(m.minx+m.maxx)/2*sc,oz:W/2+(m.minz+m.maxz)/2*sc};
    const P=R.P; const path=new Path2D(); for(let i=0;i<=P.N;i+=2){ const k=i%P.N; const x=this.miniT.ox+P.x[k]*sc, y=this.miniT.oz-P.z[k]*sc; i?path.lineTo(x,y):path.moveTo(x,y); } path.closePath(); this.miniPath=path;
    this.lastItem=undefined; this.lastPos=0; }
  introCard(on){ $('introCard').style.display=on?'block':'none'; }
  count(t){ const c=$('count'); c.textContent=t; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); c.style.color=t==='GO!'?'#7dff9a':'#fff'; }
  flash(t,col,dur){ const f=$('flash'); f.textContent=t; f.style.color=col||'#fff'; f.style.animationDuration=(dur||1.6)+'s'; f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); }
  wrong(on){ const w=$('wrong'); const d=on?'block':'none'; if(w.style.display!==d){ w.style.display=d; if(on) this.g.audio.play('wrong'); } }
  roulette(){ this.rollT=1.0; }
  hud(R){
    const c=R.player; const rank=c.finished?c.finishPos:c.rank;
    if(rank!==this.lastPos){ $('hPos').innerHTML=`${rank}<sup>${ordSuffix(rank)}</sup><small>/${R.cars.length}</small>`; this.lastPos=rank; }
    $('hLap').innerHTML=`LAP ${clamp(c.lap,1,R.laps)}<span>/${R.laps}</span>`;
    const rt=R.state==='race'||R.state==='finish'||R.state==='done'?(c.finished?c.finishTime:R.raceTime):0;
    $('hTime').textContent=fmtTime(rt); $('hLapT').textContent=fmtTime(c.lap>=1&&!c.finished?R.raceTime-c.lapStart:(c.lapTimes[c.lapTimes.length-1]||0)); $('hBest').textContent=fmtTime(c.bestLap!=null?c.bestLap:R.best.lap);
    const sp=c.speed*(this.g.S.units==='mph'?2.237:3.6); $('hSpd').textContent=Math.round(sp);
    const sorted=R.cars.slice().sort((a,b)=>(a.finished?a.finishPos:a.rank)-(b.finished?b.finishPos:b.rank));
    $('board').innerHTML=sorted.map(o=>`<div class="${o.isPlayer?'me':''}"><b>${o.finished?o.finishPos:o.rank}</b>${o.isPlayer?'YOU':o.driver} · ${o.v.name}</div>`).join('');
    // item
    let icon='',nm='';
    if(this.rollT>0){ this.rollT-=1/15; const ks=Object.keys(ITEMS); const k=ks[Math.floor(Math.random()*3)]; icon=ITEMS[k].icon; nm='. . .'; this.g.audio.play('roll'); $('itemBox').style.borderColor='#fff'; }
    else if(c.item){ icon=ITEMS[c.item].icon; nm=ITEMS[c.item].name; $('itemBox').style.borderColor=ITEMS[c.item].col; $('hItem').style.color=ITEMS[c.item].col; }
    else { $('itemBox').style.borderColor='rgba(255,255,255,.35)'; }
    $('hItem').textContent=icon; $('hItemN').textContent=nm;
    // drift / boost meter
    const bar=$('boostBar').firstElementChild;
    if(c.boost>0){ bar.style.width=clamp(c.boost/Math.max(0.5,c.boostMax),0,1)*100+'%'; bar.style.background='linear-gradient(90deg,#ffc23d,#ff2e97)'; $('boostLbl').textContent='BOOST'; }
    else if(c.drifting){ const t=c.driftT; bar.style.width=clamp(t/DRIFT_TIERS[2],0,1)*100+'%'; const cc=c.tier>=0?TIER_COL[c.tier].map(x=>Math.round(x*255)).join(','):'200,200,220'; bar.style.background=`rgb(${cc})`; $('boostLbl').textContent=c.tier>=0?['DRIFT · BLUE','DRIFT · ORANGE','DRIFT · PINK!'][c.tier]:'DRIFT'; }
    else { bar.style.width='0%'; $('boostLbl').textContent='DRIFT'; }
  }
  minimap(R){
    const g=this.miniCtx, T=this.miniT; if(!T) return; g.clearRect(0,0,340,340);
    g.save(); g.beginPath(); g.arc(170,170,168,0,TAU); g.clip();
    g.lineJoin='round'; g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=16; g.stroke(this.miniPath); g.strokeStyle='#e8e0ff'; g.lineWidth=6; g.stroke(this.miniPath);
    if(R.shooters){ g.strokeStyle='rgba(255,59,59,.85)'; g.lineWidth=10; for(const z of R.shooters.zones){ g.beginPath(); for(let q=0;q<=22;q+=2){ const k=(z.i0+q)%R.P.N; const x=T.ox+R.P.x[k]*T.sc, y=T.oz-R.P.z[k]*T.sc; q?g.lineTo(x,y):g.moveTo(x,y);} g.stroke(); } }
    const P=R.P; g.fillStyle='#fff'; const sx=T.ox+P.x[0]*T.sc, sy=T.oz-P.z[0]*T.sc; g.fillRect(sx-7,sy-3,14,6);
    const cols=['#ffc23d','#ff6b3d','#7dff6a','#b18cff','#22e4ff','#ff4fb0','#ffffff','#ff3b3b'];
    for(const c of R.cars){ if(c.isPlayer) continue; g.fillStyle=cols[VEHICLES.indexOf(c.v)%8]; g.beginPath(); g.arc(T.ox+c.x*T.sc,T.oz-c.z*T.sc,8,0,TAU); g.fill(); g.strokeStyle='#000'; g.lineWidth=2; g.stroke(); }
    const p=R.player, px=T.ox+p.x*T.sc, py=T.oz-p.z*T.sc; g.translate(px,py); g.rotate(-p.h+Math.PI); 
    g.fillStyle='#ff2e97'; g.strokeStyle='#fff'; g.lineWidth=3; g.beginPath(); g.moveTo(0,-15); g.lineTo(10,11); g.lineTo(0,5); g.lineTo(-10,11); g.closePath(); g.fill(); g.stroke();
    g.restore();
  }
  results(res){
    const pl=res.place; $('resPlace').textContent=ordinal(pl)+(pl===1?' — WINNER!':pl<=3?' — PODIUM!':' PLACE');
    $('resTrack').textContent=res.track.name+' · '+res.track.place;
    let rec=''; if(res.newRace) rec+='<div class="rec">★ New best race time '+fmtTime(res.best.race)+'</div>'; if(res.newLap) rec+='<div class="rec">★ New best lap '+fmtTime(res.best.lap)+'</div>';
    if(!rec) rec=`<div class="rec" style="color:var(--dim)">Your time ${fmtTime(res.playerTime)} · best lap ${fmtTime(res.playerBest)} · record ${fmtTime(res.best.race)}</div>`;
    $('resRec').innerHTML=rec;
    $('resTable').innerHTML=res.rows.map(r=>`<tr class="${r.player?'me':''}"><td class="p">${r.pos}</td><td>${r.player?'<b>YOU</b>':r.driver}</td><td style="color:var(--dim)">${r.car}</td><td class="t">${r.est?'<span style="color:var(--dim)">~</span>':''}${fmtTime(r.time)}</td><td class="t" style="color:var(--dim)">${r.best?'lap '+fmtTime(r.best):''}</td></tr>`).join('');
  }
}
const GP_TRACKS=['sweet','mesa','neon','alondra'], GP_ELIM=[2,1,1];
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function drawTrackThumb(cv,def){
  const g=cv.getContext('2d'), w=cv.width,h=cv.height;
  const th=THEMES[def.theme]; const bgs={country:['#ffc98a','#4f7fc4'],dusk:['#ff9a6a','#2c2f78'],city:['#f5c98a','#3f86d8'],desert:['#f0b27a','#c2562a'],coast:['#ffbe86','#1c5a8a'],night:['#3d1656','#05041a']}[def.sky||def.theme];
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,bgs[1]); gr.addColorStop(1,bgs[0]); g.fillStyle=gr; g.fillRect(0,0,w,h);
  if(!def._thumb){ const P=buildTrackPath(def); def._thumb={x:Array.from(P.x),z:Array.from(P.z),y:Array.from(P.y)}; }
  const T=def._thumb; let a=1e9,b=-1e9,c=1e9,d=-1e9; T.x.forEach((x,i)=>{a=Math.min(a,x);b=Math.max(b,x);c=Math.min(c,T.z[i]);d=Math.max(d,T.z[i]);});
  const sc=Math.min((w-40)/(b-a),(h-40)/(d-c)); const ox=w/2-(a+b)/2*sc, oz=h/2+(c+d)/2*sc;
  g.lineJoin='round'; g.beginPath(); T.x.forEach((x,i)=>{ const px=ox+x*sc, py=oz-T.z[i]*sc; i?g.lineTo(px,py):g.moveTo(px,py); }); g.closePath();
  g.strokeStyle='rgba(0,0,0,.45)'; g.lineWidth=12; g.stroke(); g.strokeStyle='#fff'; g.lineWidth=6; g.stroke(); g.strokeStyle=def.theme==='night'?'#ff2e97':'#ff2e97'; g.lineWidth=2; g.stroke();
  g.fillStyle='#22e4ff'; g.beginPath(); g.arc(ox+T.x[0]*sc,oz-T.z[0]*sc,6,0,TAU); g.fill();
}
// boot
window.addEventListener('load',()=>{
  if(typeof THREE==='undefined'){ document.body.innerHTML='<div style="color:#fff;font-family:sans-serif;padding:40px">Could not load the 3D engine (three.js) from cdnjs.cloudflare.com. Check your internet connection and reload.</div>'; return; }
  const pt=document.getElementById('pressTxt'); const keep=pt.textContent; pt.textContent='Loading cars…';
  loadCarGLBs(()=>{ pt.textContent=keep; if(GLB_ERROR){ const el=document.getElementById('err'); el.style.display='block'; el.textContent='Some custom car models could not load ('+GLB_ERROR+'), using fallback cars.'; } try{ window.GAME=new Game(); }catch(e){ const el=document.getElementById('err'); el.style.display='block'; el.textContent='Startup error: '+e.message; console.error(e); } },(a,b)=>{ pt.textContent='Loading cars… '+a+'/'+b; });
  return;
  try{ window.GAME=new Game(); }catch(e){ const el=document.getElementById('err'); el.style.display='block'; el.textContent='Startup error: '+e.message; console.error(e); }
});
window.addEventListener('error',e=>{ const el=document.getElementById('err'); if(el){ el.style.display='block'; el.textContent='Error: '+e.message; } });
