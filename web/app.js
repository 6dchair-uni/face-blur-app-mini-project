import {
    FaceDetector,
    FilesetResolver
} from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startButton");
const blurSlider = document.getElementById("blurSlider");
const blurValue = document.getElementById("blurValue");
const message = document.getElementById("message");
const status = document.getElementById("status");
const faceCount =
    document.getElementById("faceCount");
const mirrorToggle =
    document.getElementById("mirrorToggle");

let stream = null;
let detector = null;
let running = false;

let lastDetectionTime = 0;
let detections = [];

let blurLevel = 50;

let mirrorPreview = false;

mirrorToggle.addEventListener("change", () => {
    mirrorPreview = mirrorToggle.checked;
});

const DETECTION_INTERVAL = 100;


// ----------------------------------
// Blur slider
// ----------------------------------

blurSlider.addEventListener("input", () => {

    blurLevel = Number(blurSlider.value);

    blurValue.textContent = blurLevel;

});


// ----------------------------------
// Create MediaPipe detector
// ----------------------------------

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
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",

                    delegate: "GPU"
                },

                runningMode: "VIDEO",

                minDetectionConfidence: 0.3,

                minSuppressionThreshold: 0.2
            }
        );

    status.textContent = "MediaPipe ready.";
}


// ----------------------------------
// Camera
// ----------------------------------

startButton.addEventListener("click", async () => {

    if (running) {

        stopCamera();

    } else {

        await startCamera();

    }

});


async function startCamera() {

    try {

        status.textContent =
            "Requesting camera...";

        stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    width: {
                        ideal: 1280
                    },

                    height: {
                        ideal: 720
                    }
                },

                audio: false
            });


        video.srcObject = stream;

        await video.play();


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        message.style.display =
            "none";


        startButton.textContent =
            "Stop Camera";


        running = true;

        detections = [];

        lastDetectionTime = 0;


        status.textContent =
            "Camera running.";


        requestAnimationFrame(
            processFrame
        );


    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

        status.textContent =
            `Camera error: ${error.name} - ${error.message}`;

    }

}


// ----------------------------------
// Stop camera
// ----------------------------------

function stopCamera() {

    running = false;


    if (stream) {

        stream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        stream = null;
    }


    video.srcObject = null;


    detections = [];


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    startButton.textContent =
        "Start Camera";


    message.style.display =
        "flex";


    message.textContent =
        "Camera is off";


    status.textContent =
        "Camera stopped.";

}


// ----------------------------------
// Main processing loop
// ----------------------------------

function processFrame(timestamp) {

    if (!running) {
        return;
    }


    // ----------------------------------
    // Detect faces periodically
    // ----------------------------------

    if (
        detector &&
        timestamp - lastDetectionTime >= DETECTION_INTERVAL
    ) {

        lastDetectionTime =
            timestamp;


        try {

            const results =
                detector.detectForVideo(
                    video,
                    timestamp
                );


            detections =
                results.detections || [];

            faceCount.textContent = detections.length;

            status.textContent =
                `Camera running — Faces detected: ${detections.length}`;


        } catch (error) {

            console.error(
                "MediaPipe detection error:",
                error
            );

        }

    }


    // ----------------------------------
    // Draw current camera frame
    // ----------------------------------

    // ctx.drawImage(
    //     video,
    //     0,
    //     0,
    //     canvas.width,
    //     canvas.height
    // );
    ctx.save();

    if (mirrorPreview) {

        ctx.translate(
            canvas.width,
            0
        );

        ctx.scale(
            -1,
            1
        );

    }

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.restore();


    // ----------------------------------
    // Blur detected faces
    // ----------------------------------

    applyBlur();


    requestAnimationFrame(
        processFrame
    );

}


// ----------------------------------
// Apply blur
// ----------------------------------

function applyBlur() {

    if (
        detections.length === 0
    ) {

        return;

    }


    /*
     * We use the Canvas 2D filter instead
     * of OpenCV.js for now.
     *
     * This keeps the processing lightweight
     * and avoids freezing the browser.
     */

    const blurAmount =
        Math.max(
            1,
            blurLevel / 3
        );


    for (
        const detection
        of detections
    ) {

        const box =
            detection.boundingBox;


        let x =
            Math.floor(
                box.originX
            );

        let y =
            Math.floor(
                box.originY
            );

        let width =
            Math.floor(
                box.width
            );

        let height =
            Math.floor(
                box.height
            );

        if (mirrorPreview) {

            x =
                canvas.width -
                x -
                width;

        }


        // Keep coordinates inside canvas

        x =
            Math.max(
                0,
                x
            );

        y =
            Math.max(
                0,
                y
            );

        width =
            Math.min(
                width,
                canvas.width - x
            );

        height =
            Math.min(
                height,
                canvas.height - y
            );


        if (
            width <= 0 ||
            height <= 0
        ) {

            continue;

        }


        /*
         * Save the canvas state.
         */

        ctx.save();


        /*
         * Limit drawing to the detected
         * face region.
         */

        ctx.beginPath();

        ctx.rect(
            x,
            y,
            width,
            height
        );

        ctx.clip();


        /*
         * Apply browser-native blur.
         */

        ctx.filter =
            `blur(${blurAmount}px)`;


        /*
         * Slightly expand the source region
         * so the edges of the face are also
         * blurred.
         */

        const padding =
            Math.ceil(
                blurAmount * 2
            );


        const sourceX =
            Math.max(
                0,
                x - padding
            );

        const sourceY =
            Math.max(
                0,
                y - padding
            );

        const sourceWidth =
            Math.min(
                canvas.width - sourceX,
                width + padding * 2
            );

        const sourceHeight =
            Math.min(
                canvas.height - sourceY,
                height + padding * 2
            );


        /*
         * Draw the already-rendered canvas
         * back onto itself with the blur.
         */

        ctx.drawImage(
            canvas,

            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,

            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight
        );


        ctx.restore();

    }

}


// ----------------------------------
// Initialize
// ----------------------------------

createDetector()
    .catch(error => {

        console.error(
            "MediaPipe initialization failed:",
            error
        );

        status.textContent =
            "MediaPipe failed to initialize.";

    });