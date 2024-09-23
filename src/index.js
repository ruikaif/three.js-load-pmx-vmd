import * as THREE from 'three';


import ThreeMeshUI from 'three-mesh-ui';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper.js';
import TextSprite from '@seregpie/three.text-sprite';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js'








let scene, renderer, camera, mesh,stagemesh_shop,stagemesh_room, stagemesh_restaurant,helper;

let stage_mesh_id="shop";

let load_modeler;

let ready = false;

let labelRenderer;

let axesHelper ;

let  raycaster = new THREE.Raycaster();

let control;

let index=0;
 

//browser size
const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

//Obujet Clock
const clock = new THREE.Clock();


const Pmx = "./pmx/03/03.pmx";
const shop_stage_path="./stages/shop/shop.pmx";
const room_stage_path="./stages/room/room.pmx"
const MotionObjects = [
  { id: "loop", VmdClip: null, AudioClip: false },
  { id: "talk", VmdClip: null, AudioClip: true },
  { id: "hello", VmdClip: null, AudioClip: true },
  { id: "talk2", VmdClip: null, AudioClip: true },
  { id: "pointer", VmdClip: null, AudioClip: true },
  { id: "think", VmdClip: null, AudioClip: true },
  { id: "walk", VmdClip: null, AudioClip: true },
];

const StageObjects = [
  { id: "room", path:"./stages/room/room.pmx" ,mesh:stagemesh_room},
  { id: "shop", path:"./stages/shop/shop.pmx", mesh:stagemesh_shop},  
  // { id: "restaurant", path:"./stages/restaurant/restaurant.pmx", mesh:stagemesh_restaurant},  
  
];


window.onload = () => {
  Init();
  LoadModeler();
  Render();
  setTimeout(()=>{
    VmdControl('loop',true)
  },3000)
  SelectPage()
}




const Init = () => {
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0xffffff);

  const ambient = new THREE.AmbientLight(0xeeeeee);
  scene.add(ambient);

  axesHelper = new THREE.AxesHelper(1);
  axesHelper.visible = false;
  scene.add(axesHelper);

 
 
    

  //init render
  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xd3d3d3, 0);
  console.log(renderer.info)

  //init label render
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = "absolute";
  labelRenderer.domElement.style.top = "0px";
  document.body.appendChild(labelRenderer.domElement);

  // chat bubble
  document.body.appendChild(renderer.domElement);

  //camera
  camera = new THREE.PerspectiveCamera(40, windowWidth / windowHeight, 1, 1000);
  camera.position.set(0, 15, 30);
  
  
};
var loader = new MMDLoader();
const LoadStage=async(stageobject)=> {
   
  
  
return await new Promise((resolve, reject) => {
  
    loader.load(stageobject.path, (stage) => {
      stageobject.mesh=stage      
      scene.add(stageobject.mesh);
      if(stageobject.id=="room"){
        stageobject.mesh.position.set(0,0,7);
      stageobject.mesh.visible=true;
      }
      else{
        stageobject.mesh.position.set(0, 0, -6);
        stageobject.mesh.rotateY(200);
        stageobject.mesh.visible=false;

      }
   resolve(true);
   }, onProgress, onError);

  });
}

const LoadStages=async()=>{
  await Promise.all(StageObjects.map(async(stageobject)=>{
    return  await LoadStage(stageobject)
    
  }))
}




const LoadModeler = async () => {
	
  
	//Loading PMX
	const LoadPMX = () => {
	  return new Promise(resolve => {
		loader.load(Pmx, (object) => {
		  mesh = object;
		  mesh.position.set(1,0,-12);
		  scene.add(mesh);
  
		  resolve(true);
		}, onProgress, onError);
	  });
	}
  
	//Loading VMD
	const LoadVMD = (id) => {
	  return new Promise(resolve => {
		const path = "./vmd/" + id + ".vmd";
		const val = MotionObjects.findIndex(MotionObject => MotionObject.id == id);
  
		loader.loadAnimation(path, mesh, (vmd) => {
		  vmd.name = id;
      
		  MotionObjects[val].VmdClip = vmd;
  
		  resolve(true);
		}, onProgress, onError);
	  });
	}
    
	//Load Audio
	// const LoadAudio = (id) => {
	  
	//   return new Promise(resolve => {
	// 	const path = "./audio/" + id + ".mp3";
	// 	const val = MotionObjects.findIndex(MotionObject => MotionObject.id == id);
  
	// 	if (MotionObjects[val].AudioClip) {
	// 	  new THREE.AudioLoader().load(path, (buffer) => {
	// 		const listener = new THREE.AudioListener();
	// 		const audio = new THREE.Audio(listener).setBuffer(buffer);
	// 		MotionObjects[val].AudioClip = audio;
  
	// 		resolve(true);
	// 	  }, onProgress, onError);
	// 	} else {
	// 	  resolve(false);
	// 	}
	//   });
	// }
  
	// Loading PMX Model...
	await LoadPMX();
	await LoadStages();

	
  
	// Loading VMD...
	await Promise.all(MotionObjects.map(async (MotionObject) => {
	  return await LoadVMD(MotionObject.id);
	}));
  
	// Loading Audio...
	// await Promise.all(MotionObjects.map(async (MotionObject) => {
	//   return await LoadAudio(MotionObject.id);
	// }));
  
	//Set VMD on Mesh
	VmdControl("loop", true);

  
  }


  const VmdControl = (id, loop) => {
	const index = MotionObjects.findIndex(MotionObject => MotionObject.id == id);
  
	// Not Found id
	if (index === -1) {
	  // console.log("not Found ID");
	  return;
	}
  
	ready = false;
	helper = new MMDAnimationHelper({ afterglow: 2.0, resetPhysicsOnLoop: true });
  
	// 
	helper.add(mesh, {
	  animation: MotionObjects[index].VmdClip,
	  physics: false
	});
  
	
  
	const mixer = helper.objects.get(mesh).mixer;
  mixer.existingAction(MotionObjects[index].VmdClip).setLoop(THREE.LoopPingPong)
  
	//animation Loop Once
	if (!loop) {
	  mixer.existingAction(MotionObjects[index].VmdClip).setLoop(THREE.LoopOnce);
	}
  
	// VMD Loop Event
	mixer.addEventListener("loop", (event) => {
	  // console.log("loop");
	});
  
	// VMD Loop Once Event
	mixer.addEventListener("finished", (event) => {
	  // console.log("finished");
	  VmdControl("loop", true);
	});
  
  
	ready = true;
	
  }

  
  
  
  
  /*
   * Loading PMX or VMD or Voice
   */
  const onProgress = (xhr) => {
	if (xhr.lengthComputable) {
	  const percentComplete = xhr.loaded / xhr.total * 100;
	  // console.log(Math.round(percentComplete, 2) + '% downloaded');
	}
  }
  
 
  const onError = (xhr) => {
	// console.log("ERROR");
  }
  
  /*
   * MMD Model Render
   */
 const  Render = () => {
	requestAnimationFrame(Render);
	renderer.clear();
  // control.update();
	renderer.render(scene, camera);
	
	labelRenderer.render( scene, camera );
  
	if (ready) {
	  helper.update(clock.getDelta());
	}
  }
  
  /*
   * Click Event
   */

var img_mesh;
var n=1;
var size="1024x1024";

// Show Image
const ShowImage=async (prompt)=>{
  var airesponse=await ImageClient.images.generate({ prompt, model: "", n, size })
  var url=airesponse.data[0].url;


var dispaly_image_loader = new THREE.TextureLoader();
dispaly_image_loader.load(url,(map)=>{
  var material = new THREE.MeshLambertMaterial({
    map: map
  });
  var geometry = new THREE.PlaneGeometry(14, 14*.75);

// combine our image geometry and material into a mesh
 img_mesh = new THREE.Mesh(geometry, material);

// set the position of the image mesh in the x,y,z dimensions
img_mesh.position.set(-14,20,-25)

// add the image to the scene
scene.add(img_mesh);

});
}






const RemoveImage = () => {
  scene.remove(img_mesh);
  img_mesh = undefined;
};

//Select Page
const SelectHtmlContent= document.createElement("div");
SelectHtmlContent.style.width="100%"
SelectHtmlContent.style.height="100%"
SelectHtmlContent.style.backgroundColor="lightblue";



const SelectPage=()=>{
  let title_div=document.createElement("div");
  title_div.style.width="25%"
  // title_div.style.height="100px";
  SelectHtmlContent.appendChild(title_div)
  for(var i=0;i<6;i++ )
  {
    let pic_div=document.createElement("div");
    pic_div.className="talk-bubble round border"
    pic_div.style.width="25%"
    pic_div.style.height="40%";   
    pic_div.style.display="inline-block"
    pic_div.style.marginLeft="5%"
    

    let pic_img=document.createElement("img");
    pic_img.src=`/assets/${i}.png`;
    pic_img.style.width="90%";
    pic_img.style.height="75%";
    pic_img.style.marginLeft="5%";
    

    let text_block=document.createElement("p");
    text_block.style.width="90%";
    text_block.style.height="10%";
    text_block.style.textAlign="center"

    let text = document.createTextNode(`character${i+1}`);
    text_block.appendChild(text)

    pic_div.appendChild(text_block);
    pic_div.appendChild(pic_img);
    SelectHtmlContent.appendChild(pic_div);
  }


  let axisLabel = new CSS2DObject(SelectHtmlContent);

  axisLabel.position.set(0,15, 0);
  axesHelper.add(axisLabel);

  SelectHtmlContent.addEventListener("click",()=>{
    axesHelper.remove(axisLabel);
    UserPanel()
    setTimeout(()=>{
      VmdControl("hello", false);      
      AITalk("Hello, nice to meet you!", false);
    },2500)
   
    
    

  })



}

//Canvas

const CanvasContent=document.createElement("canvas")
CanvasContent.style.width="300px"
CanvasContent.style.height="300px"
const video=document.querySelector('video')




const drawImage=()=>{
  CanvasContent.getContext('2d').drawImage(video, 0, 0,100,100);
}

var canvasInterval;

video.onpause = function() {
  clearInterval(canvasInterval);
};
video.onended = function() {
  clearInterval(canvasInterval);
};
video.onplay = function() {
  clearInterval(canvasInterval);
  canvasInterval = window.setInterval(() => {
    drawImage(video);
  }, 1000 / 60);
};


const ShowHeadPoseVideo=()=>{
  
  video.play()
  let axisLabel = new CSS2DObject(CanvasContent);

  axisLabel.position.set(18, 10, -8);
  // axisLabel.center.set

  // connect by adding to 3D-Element
  axesHelper.add(axisLabel);
}


//User Panel
const UserPanelHtmLContent = document.createElement("div");


const UserPanel=()=>{
  let input =document.createElement("input");

  let button=document.createElement("button");
  button.innerText="Send"
  button.addEventListener("click",()=>{    
    if(input.value){
    Chat(input.value, "user");
    runAssistant(input.value);
    input.value=null;

    }
    

  })

  let pose_button=document.createElement("button");
  pose_button.innerText="HeadPose"
  pose_button.addEventListener("click", async() => {
    ShowHeadPoseVideo();
    // headPoses=[];
    var ImgInterval = window.setInterval(() => {
      CanvasContent.toBlob(async (blob) => {
        await detect_from_video(blob.stream());
      });
    }, 300);

    setTimeout(()=>{
      clearInterval(ImgInterval)
    },1500)
    
    while(headPoses.count<5){
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    if(HeadNode(headPoses)){
      debugger
      Chat("Yes",user)
    }

    headPoses=[];
  });
      // setTimeout(()=>{ 
        
      
     
  
        
        
      // },1400)

      // setTimeout(()=>{
        
      // },4000)



  UserPanelHtmLContent.appendChild(input)
  UserPanelHtmLContent.appendChild(button)
  UserPanelHtmLContent.appendChild(pose_button)

  let axisLabel = new CSS2DObject(UserPanelHtmLContent);

  axisLabel.position.set(10, 4, -8);
  axesHelper.add(axisLabel);

  
}




//Chat
const HtmLContent = document.createElement("div");
HtmLContent.style.width="400px"
HtmLContent.style.height="1500px"




const Chat = (content, role) => {
  

  if (HtmLContent.childNodes.length >0) {
    HtmLContent.removeChild(HtmLContent.childNodes[0]);
    
  }

  if (role == "user") {
    let talk_bubble_user = document.createElement("div");
    talk_bubble_user.className = "talk-bubble tri-right round border right-top";
    talk_bubble_user.style.animationName = "animate-fade";
    talk_bubble_user.style.animationDuration = "3s";
    talk_bubble_user.style.backgroundColor="lightgreen"
    talk_bubble_user.style.float = "right";

    let talktext_user = document.createElement("div");
    talktext_user.className = "talktext";

    let acontent = document.createElement("p");
    acontent.textContent = content;

    acontent.style.margin = "8px";

    talktext_user.appendChild(acontent);
    talk_bubble_user.appendChild(talktext_user);
    HtmLContent.appendChild(talk_bubble_user);
    
  } else {
    let talk_bubble_ai = document.createElement("div");
    talk_bubble_ai.className = "talk-bubble tri-right round border left-top";
    
    talk_bubble_ai.style.animationName = "animate-fade";
    talk_bubble_ai.style.animationDuration = "3s";

    let talktext_ai = document.createElement("div");
    talktext_ai.className = "talktext";

    let qcontent = document.createElement("p");
    qcontent.textContent = content;

    qcontent.style.margin = "8px";

    talktext_ai.appendChild(qcontent);
    talk_bubble_ai.appendChild(talktext_ai);
    HtmLContent.appendChild(talk_bubble_ai);
    
    
    
  }

  let axisLabel = new CSS2DObject(HtmLContent);

  axisLabel.position.set(7.2, -7.4, -8);
  // axisLabel.center.set

  // connect by adding to 3D-Element
  axesHelper.add(axisLabel);
  if(img_mesh){
    RemoveImage();
  }
};







document.body.addEventListener("keydown", async(e) => {
 
  switch (e.key) {
    
      case "e":
        if(HeadNode(headPoses)){
          Chat("Yes","user")
        }
      
      break;

    case "Enter":
      await ShowImage("apple")
      break;
    case "Shift":
      await SwitchStage();
      break;

    default:
     
      break;
  }
});









//Azure Speech Service
const subscriptionKey="5ea83268a7444458ab077f1e7c3f2a92";
const serviceRegion="eastus";
var SpeechSDK;
var recognizer;
var synthesizer;
var player;

if (!!window.SpeechSDK) {
  
  SpeechSDK = window.SpeechSDK;
  
}

var speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);

speechConfig.speechRecognitionLanguage = "en-US";


// var recognizer_audioConfig= SpeechSDK.AudioConfig.Fro


const AITalk = (message, talk_pose = true) => {
  player = new SpeechSDK.SpeakerAudioDestination();
  player.onAudioStart = () => {
    if(talk_pose){
      VmdControl("talk",true)
      console.log("start");
    }
    
  };
  player.onAudioEnd = () => {
    if(talk_pose){
      VmdControl("loop",true)
    }    
    player.close();
    player = undefined;
    console.log("end");
  };

  var audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);
   
  synthesizer = new SpeechSDK.SpeechSynthesizer(
    speechConfig,audioConfig
  );
  

  synthesizer.speakTextAsync(
    message,
    function (result) {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted)
      {
        Chat(message, "ai");
        
      } 
      else if (result.reason === SpeechSDK.ResultReason.Canceled) {
      }
     
     
      synthesizer.close();
      synthesizer = undefined;
      
    },
    function (err) {
     
      synthesizer.close();
      synthesizer = undefined;
    }
  );
};


const  Communicate=()=>{
  recognizer = new SpeechSDK.SpeakerRecognizer(speechConfig, audioConfig);
  recognizer.startContinuousRecognitionAsync();
  recognizer.recognized = function(s, e){
    // console.log('recognized text', e.result.text);
    if(e.result.text){
      runAssistant(e.result.text)
        Chat(e.result.text,'user')
    }
    else{
      runAssistant("Play a game")
      Chat("Play a game",'user')
    }
};


  
};













//Azure Ai service

const  azureOpenAIEndpoint = "https://platinumai.openai.azure.com";
const azureOpenAIKey = "f1204c04dc4a44429b7cbb9f4887685e";

const azureOpenAIVersion = "2024-05-01-preview";

const { AzureOpenAI } = require('openai');
const getClient = () => {
    const assistantsClient = new AzureOpenAI({
        endpoint: azureOpenAIEndpoint,
        apiVersion: azureOpenAIVersion,
        apiKey: azureOpenAIKey,
		dangerouslyAllowBrowser: true
    });
    return assistantsClient;
};

const assistantsClient = getClient();

const ImageazureOpenAIVersion = "2024-04-01-preview";

const getImageClient = () => {
  const assistantsClient = new AzureOpenAI({
      endpoint: azureOpenAIEndpoint,
      apiVersion: ImageazureOpenAIVersion,
      apiKey: azureOpenAIKey,
      deployment:"Dalle3",
  dangerouslyAllowBrowser: true
  });
  return assistantsClient;
};

const ImageClient = getImageClient();




const role = "user";

// Retrive an assistant
const assistantResponse = await assistantsClient.beta.assistants.retrieve("asst_FULTgM8Ff547yhxDkCFmx40T");
// console.log(`Assistant retrived: ${JSON.stringify(assistantResponse)}`);

// Create a thread
const assistantThread = await assistantsClient.beta.threads.create({});
// console.log(`Thread created: ${JSON.stringify(assistantThread)}`);


var run_id;


const runAssistant = async (message) => {
  try {
    // Add a user question to the thread
    const threadResponse = await assistantsClient.beta.threads.messages.create(
      assistantThread.id,
      {
        role,
        content: message,
      }
    );
    console.log(`Message created: ${JSON.stringify(threadResponse)}`);

    // Run the thread and poll it until it is in a terminal state
    
    const runResponse = await assistantsClient.beta.threads.runs.create(
      assistantThread.id,
      {
        assistant_id: assistantResponse.id,
      }
    );
    console.log(`Run started: ${JSON.stringify(runResponse)}`);

    // Polling until the run completes or fails
    let runStatus = runResponse.status;
    while (runStatus === "queued" || runStatus === "in_progress"|| runStatus === "requires_action") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const runStatusResponse =
        await assistantsClient.beta.threads.runs.retrieve(
          assistantThread.id,
          runResponse.id
        );
      runStatus = runStatusResponse.status;

      if(runStatus === "requires_action"){
        debugger
        var tool_calls=runStatusResponse.required_action.submit_tool_outputs.tool_calls
        var functionname=tool_calls[0].function.name
        var arguements=JSON.parse(tool_calls[0].function.arguments)
        
        var functionresult=functiondic[functionname](arguements)
        var result=await assistantsClient.beta.threads.runs.submitToolOutputs(assistantThread.id,runResponse.id,{ tool_outputs:[{
          tool_call_id:tool_calls[0].id,
          output:functionresult
        }] })
      }
      console.log(`Current run status: ${runStatus}`);
    }

    if (runStatus === "completed") {      
      const messagesResponse =
        await assistantsClient.beta.threads.messages.list(assistantThread.id);
		const currentresp=messagesResponse.data[0].content[0].text.value
    
		AITalk(currentresp)
    }
    
    else{
      // console.log(`Run status is ${runStatus}, unable to fetch messages.`);
    }
    
  } catch (error) {
    // console.error(`Error running the assistant: ${error.message}`);
  }
};






var headPoses=[];


//Azure AI Vision Face
const { AzureKeyCredential } = require("@azure/core-auth");

const createFaceClient = require("@azure-rest/ai-vision-face").default,
  { getLongRunningPoller } = require("@azure-rest/ai-vision-face");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const endpoint = "https://hackathon2024faceapi.cognitiveservices.azure.com/";
const apikey = "15756b6464a340febf89bf56ea361b3a";
const credential = new AzureKeyCredential(apikey);
const ai_face_client = createFaceClient(endpoint, credential);



const detect_from_video=async (stream)=>{
   
    const result= await ai_face_client.path('/detect').post({
      contentType: 'application/octet-stream',
      queryParameters: {
        detectionModel: "detection_03",
        recognitionModel: "recognition_01",
        returnFaceLandmarks: false,
        returnRecognitionModel: true,
        faceIdTimeToLive: 120,
        returnFaceAttributes: ["headPose"],
        returnFaceId: false,
      },    
      body: stream
      
      })
     
     if(result.body[0]){
      headPoses.push(result.body[0].faceAttributes.headPose.pitch)
      console.log(result.body[0].faceAttributes.headPose)
     }
    

   }
   
    
   
   
   



const HeadNode=(array)=>{
  debugger
  var pitch_max=Math.max(...array);
  var pitch_min=Math.min(...array);
  return ((pitch_max-pitch_min)>5)?true:false
}


const functiondic={
  create_image:(arguement)=>{
    var img_description=arguement.description
    ShowImage(img_description)
    return "success"
  },

  switch_game_scene:(arguement)=>{
    var gamename=arguement.game_name
    switch (gamename) {
      case "Shopping Adventure":
        StageObjects[0].mesh.visible = false;
        StageObjects[1].mesh.visible = true;

        break;
      case "Fruit Explorer":
        StageObjects[0].mesh.visible = true;
        StageObjects[1].mesh.visible = false;
        break;

      default:
        break;
    }
    
    return  "success"
  },
  
   character_action:(arguement)=>{
    var action= arguement.action_name;//jump:success
    VmdControl("think",false)
    return "success"
  }


}







 




 























 









			





