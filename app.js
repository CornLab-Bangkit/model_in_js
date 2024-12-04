let model;

// Define the L2 regularizer
class L2 {
    static className = 'L2';

    constructor(config) {
        return tf.regularizers.l1l2(config);
    }
}

tf.serialization.registerClass(L2);

const categories = ["Blight", "Common", "Gray", "Healthy"];

// Load the model
async function loadModel() {
    const model = await tf.loadLayersModel('model_js/model.json');
    return model;
}

// Handle image upload and prediction
document.getElementById('file-upload').addEventListener('change', async (event) => {
    const model = await loadModel();
    const outputElement = document.getElementById('output');
    const files = event.target.files;

    // Clear previous output
    outputElement.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const image = new Image();
            image.src = e.target.result;
            image.onload = async function() {
                // Preprocess image similar to Python code
                const tensor = tf.browser.fromPixels(image)
                    .resizeNearestNeighbor([224, 224])
                    .toFloat();
                const expandedTensor = tensor.expandDims(0); // Add batch dimension

                // Predict the class
                const prediction = await model.predict(expandedTensor).data();

                // Get the index of the highest prediction
                const predictionIndex = prediction.indexOf(Math.max(...prediction));

                // Define classes
                const classes = ["Blight", "Common", "Gray", "Healthy"];

                // Display output
                const predictedClass = classes[predictionIndex];
                outputElement.innerHTML += `<p>Model output: [${prediction}]<br>${file.name} is ${predictedClass}</p>`;
            };
        };

        reader.readAsDataURL(file);
    }
});
