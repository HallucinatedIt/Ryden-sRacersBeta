// Ryden's Racers · three.js r186 bundle (WebGL build). Exposes window.THREE for the classic-script game.
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
window.THREE = Object.assign({}, T, { GLTFLoader, KTX2Loader, MeshoptDecoder, FullScreenQuad, GTAOPass, UnrealBloomPass, SMAAPass, LUTCubeLoader, Sky, BufferGeometryUtils });
