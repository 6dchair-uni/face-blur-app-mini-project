// import {
//     FaceDetector,
//     FilesetResolver
// } from "@mediapipe/tasks-vision";


// const video =
//     document.getElementById("video");

// const canvas =
//     document.getElementById("canvas");

// const ctx =
//     canvas.getContext("2d");


// const startButton =
//     document.getElementById(
//         "startButton"
//     );

// const blurSlider =
//     document.getElementById(
//         "blurSlider"
//     );

// const blurValue =
//     document.getElementById(
//         "blurValue"
//     );

// const message =
//     document.getElementById(
//         "message"
//     );

// const status =
//     document.getElementById(
//         "status"
//     );


// let stream = null;

// let running = false;

// let detector = null;

// let blurLevel = 30;

// let detections = [];

// let frameCounter = 0;

// let cvReady = false;

// cv['onRuntimeInitialized'] = () => {
//     cvReady = true;
//     status.textContent = "OpenCV ready.";
// };


// // ----------------------------------
// // Settings
// // ----------------------------------

// const DETECTION_INTERVAL = 2;


// // ----------------------------------
// // Blur slider
// // ----------------------------------

// blurSlider.addEventListener(
//     "input",
//     () => {

//         blurLevel =
//             Number(
//                 blurSlider.value
//             );

//         blurValue.textContent =
//             blurLevel;

//     }
// );


// // ----------------------------------
// // Create detector
// // ----------------------------------

// async function createDetector() {

//     status.textContent =
//         "Initializing face detector...";


//     // const vision =
//     //     await FilesetResolver.forVisionTasks(
//     //         "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
//     //     );
//     const vision = await FilesetResolver.forVisionTasks(
//         "/mediapipe/wasm"
//     );


//     detector =
//         await FaceDetector.createFromOptions(
//             vision,
//             {

//                 baseOptions: {

//                     modelAssetPath:
//                         "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",

//                     delegate: "GPU"

//                 },


//                 runningMode:
//                     "VIDEO",


//                 minDetectionConfidence:
//                     0.3,


//                 minSuppressionThreshold:
//                     0.2

//             }
//         );


//     status.textContent =
//         "Face detector ready.";

// }


// // ----------------------------------
// // Camera
// // ----------------------------------

// startButton.addEventListener(
//     "click",
//     async () => {

//         if (running) {

//             stopCamera();

//         } else {

//             await startCamera();

//         }

//     }
// );


// async function startCamera() {

//     try {

//         stream =
//             await navigator.mediaDevices
//                 .getUserMedia({

//                     video: {

//                         width: {
//                             ideal: 1280
//                         },

//                         height: {
//                             ideal: 720
//                         }

//                     },

//                     audio: false

//                 });


//         video.srcObject =
//             stream;


//         await video.play();


//         canvas.width =
//             video.videoWidth;

//         canvas.height =
//             video.videoHeight;


//         message.style.display =
//             "none";


//         startButton.textContent =
//             "Stop Camera";


//         status.textContent =
//             "Camera running.";


//         running = true;

//         frameCounter = 0;

//         detections = [];


//         requestAnimationFrame(
//             processFrame
//         );


//     } catch (error) {

//         console.error("Camera error:", error);

//         status.textContent =
//             `Camera error: ${error.name} - ${error.message}`;

//     }

// }


// function stopCamera() {

//     running = false;


//     if (stream) {

//         stream
//             .getTracks()
//             .forEach(
//                 track => track.stop()
//             );

//         stream = null;

//     }


//     video.srcObject =
//         null;


//     detections = [];


//     ctx.clearRect(
//         0,
//         0,
//         canvas.width,
//         canvas.height
//     );


//     message.style.display =
//         "flex";


//     message.textContent =
//         "Camera is off";


//     startButton.textContent =
//         "Start Camera";


//     status.textContent =
//         "Camera stopped.";

// }


// // ----------------------------------
// // Processing
// // ----------------------------------

// function processFrame() {

//     if (!running) {
//         return;
//     }


//     // Detect periodically

//     if (
//         frameCounter %
//         DETECTION_INTERVAL === 0
//     ) {

//         detectFaces();

//     }


//     // Draw camera frame

//     ctx.drawImage(
//         video,
//         0,
//         0,
//         canvas.width,
//         canvas.height
//     );


//     // Blur detected faces

//     applyBlur();


//     frameCounter++;


//     requestAnimationFrame(
//         processFrame
//     );

// }


// // ----------------------------------
// // Detect faces
// // ----------------------------------

// function detectFaces() {

//     if (!detector) {
//         return;
//     }


//     const results =
//         detector.detectForVideo(
//             video,
//             performance.now()
//         );


//     detections =
//         results.detections || [];

// }


// // ----------------------------------
// // Apply median blur
// // ----------------------------------

// function applyBlur() {
//     if (!cvReady || detections.length === 0) {
//         return;
//     }

//     // if (
//     //     detections.length === 0
//     // ) {
//     //     return;
//     // }


//     let frame =
//         cv.imread(canvas);


//     for (
//         const detection
//         of detections
//     ) {

//         const box =
//             detection.boundingBox;


//         let x =
//             Math.floor(
//                 box.originX
//             );


//         let y =
//             Math.floor(
//                 box.originY
//             );


//         let width =
//             Math.floor(
//                 box.width
//             );


//         let height =
//             Math.floor(
//                 box.height
//             );


//         x =
//             Math.max(
//                 0,
//                 x
//             );

//         y =
//             Math.max(
//                 0,
//                 y
//             );


//         width =
//             Math.min(
//                 width,
//                 canvas.width - x
//             );


//         height =
//             Math.min(
//                 height,
//                 canvas.height - y
//             );


//         if (
//             width <= 0 ||
//             height <= 0
//         ) {
//             continue;
//         }


//         const roi =
//             frame.roi(
//                 new cv.Rect(
//                     x,
//                     y,
//                     width,
//                     height
//                 )
//             );


//         const blurred =
//             new cv.Mat();


//         let kernel =
//             Math.max(
//                 3,
//                 Math.floor(
//                     blurLevel
//                 )
//             );


//         if (
//             kernel % 2 === 0
//         ) {

//             kernel += 1;

//         }


//         cv.medianBlur(
//             roi,
//             blurred,
//             kernel
//         );


//         blurred.copyTo(
//             roi
//         );


//         roi.delete();

//         blurred.delete();

//     }


//     cv.imshow(
//         canvas,
//         frame
//     );


//     frame.delete();

// }


// // ----------------------------------
// // Initialize
// // ----------------------------------

// createDetector()
//     .catch(
//         error => {

//             console.error(error);

//             status.textContent =
//                 "Failed to initialize face detector.";

//         }
//     );

import {
    FaceDetector,
    FilesetResolver
} from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const message = document.getElementById("message");
const status = document.getElementById("status");

let stream = null;
let detector = null;
let running = false;
let lastDetectionTime = 0;

async function createDetector() {

    status.textContent = "Loading MediaPipe...";

    const vision =
        await FilesetResolver.forVisionTasks(
            "/mediapipe/wasm"
        );

    detector =
        await FaceDetector.createFromOptions(
            vision,
            {
                baseOptions: {
                    // modelAssetPath:
                    //     "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",    
                    delegate: "GPU"
                },

                runningMode: "VIDEO",
                minDetectionConfidence: 0.3,
                minSuppressionThreshold: 0.2
            }
        );

    status.textContent =
        "MediaPipe ready.";
}

startButton.addEventListener("click", async () => {

    if (running) {
        stopCamera();
        return;
    }

    try {

        status.textContent = "Requesting camera...";

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        video.srcObject = stream;

        await video.play();

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        message.style.display = "none";

        startButton.textContent = "Stop Camera";

        running = true;

        status.textContent = "Camera running.";

        requestAnimationFrame(processFrame);

    } catch (error) {

        console.error(error);

        status.textContent =
            `Camera error: ${error.name} - ${error.message}`;

    }
});

function stopCamera() {

    running = false;

    if (stream) {

        stream.getTracks().forEach(
            track => track.stop()
        );

        stream = null;
    }

    video.srcObject = null;

    startButton.textContent = "Start Camera";

    message.style.display = "flex";

    message.textContent = "Camera is off";

    status.textContent = "Camera stopped.";
}

function processFrame(timestamp) {

    if (!running) {
        return;
    }

    // Draw the live camera frame
    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Detect approximately every 100 ms
    if (
        detector &&
        timestamp - lastDetectionTime >= 100
    ) {

        lastDetectionTime = timestamp;

        try {

            const results =
                detector.detectForVideo(
                    video,
                    timestamp
                );

            const detections =
                results.detections || [];

            status.textContent =
                `Camera running — Faces detected: ${detections.length}`;

            // Draw detected face boxes
            detections.forEach(
                (detection, index) => {

                    const box =
                        detection.boundingBox;

                    ctx.strokeStyle = "red";
                    ctx.lineWidth = 2;

                    ctx.strokeRect(
                        box.originX,
                        box.originY,
                        box.width,
                        box.height
                    );

                    ctx.fillStyle = "red";
                    ctx.font = "16px Arial";

                    ctx.fillText(
                        `Face ${index + 1}`,
                        box.originX,
                        Math.max(
                            box.originY - 8,
                            16
                        )
                    );
                }
            );

        } catch (error) {

            console.error(
                "MediaPipe detection error:",
                error
            );
        }
    }

    requestAnimationFrame(processFrame);
}

createDetector().catch(error => {

    console.error(
        "MediaPipe initialization failed:",
        error
    );

    status.textContent =
        "MediaPipe failed to initialize.";

});