import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";



function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionIntervalRef = useRef(null);
  const [predictions, setPredictions] = useState([]);


  //set up webcam
  const setupWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => resolve();
      });
      videoRef.current.play();
    } catch (err) {
      console.error("Error accessing the webcam:", err);
    }
  };

  //Load the COCO-SSD model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log("Model loaded!");
      } catch (err) {
        console.error("Error loading the model:", err);
      }
    };

    loadModel();
    setupWebcam();
  }, []);

  //Run Detection
  const detectObjects = async () => {
    if (model && videoRef.current && videoRef.current.readyState === 4) {
      const predictions = await model.detect(videoRef.current);
      setPredictions(predictions)

      //Adjust the canvas to video dimensions
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      //Draw predictions
      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;
        const text = `${prediction.class} (${Math.round(prediction.score *  100)}%)`;

        //Draw bounding box
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);


        //Draw label background
        ctx.fillStyle = "#00FF00"
        ctx.fillRect(x, y - 20, ctx.measureText(text).width + 10, 20);

        //Draw text
        ctx.fillStyle ="#00000";
        ctx.font = "16px Arial";
        ctx.fillText(text, x + 5, y - 5);
      });
    }
  };

  const toggleDetection = () => {
    if (isDetecting) {
      // Stop detection
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    } else {
      // Start detection
      detectionIntervalRef.current = setInterval(() => {
        detectObjects();
      }, 100);
    }
    setIsDetecting(!isDetecting);
  };


  return (
    <div className="App">
      <video ref={videoRef} className="webcam" muted autoPlay></video>
      <canvas ref={canvasRef} className="overlay"></canvas>
      <button className="toggle-button" onClick={toggleDetection}>
        {isDetecting ? "Stop Detection" : "Start Detection"}
      </button>
      {/* Display predictions */}
      <div className="predictions">
        <h3>Predictions:</h3>
        <ul>
          {predictions.map((prediction, index) => (
            <li key={index}>
              {prediction.class} ({Math.round(prediction.score * 100)}%)
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
