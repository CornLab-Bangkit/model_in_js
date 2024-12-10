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
                // const predictedClass = classes[predictionIndex];
                // outputElement.innerHTML += `<p>Model output: [${prediction}]<br>${file.name} is ${predictedClass}</p>`;

                // Variabel penjelasan untuk setiap klasifikasi
                const explanations = {
                  "Blight" : "Blight is a disease caused by fungal or bacterial infections, which can lead to serious damage to the leaves and plants of corn.",
                  "Common" : "Common refers to the condition of a corn plant that shows no clear signs of disease or visible disturbances.",
                  "Gray" : "Gray indicates a possible infection or mild damage to the corn plant, which could be caused by environmental factors or a mild disease.",
                  "Healthy" : "Healthy means the corn plant is in good condition with no signs of issues or disease."
                };

                // Display output
                const predictedClass = classes[predictionIndex];
                let explanationText = "";

                // Memeriksa jika jagung terkena Blight
                if (predictedClass === "Blight") {
                  explanationText = explanations["Blight"];
                } else if (predictedClass === "Common") {
                  explanationText = explanations["Common"];
                } else if (predictedClass === "Gray") {
                  explanationText = explanations["Gray"];
                } else if (predictedClass === "Healthy") {
                  explanationText = explanations["Healthy"];
                }


                outputElement.insertAdjacentHTML('beforeend', `
                  <div class="mt-3">
                      <img src="${e.target.result}" width="224" height="224" class="mt-3 rounded-lg style="object-fit: cover; width: 224px; height: 224px;""/>
                      <p>Image ${file.name} is predicted as: <strong>${predictedClass}</strong></p>
                      <p class="mt-2 text-gray-700">Explanation: ${explanationText}</p>
                  </div>
                `);
            };
        };

        reader.readAsDataURL(file);
    }
});


// #######################################################

// Menangani klik tombol kirim untuk mengirim pertanyaan ke server
document.getElementById('kirim').addEventListener('click', function() {
    const question = document.getElementById('tanya').value;
    
    if (question.trim() === '') {
      alert('Pertanyaan tidak boleh kosong!');
      return;
    }
  
    // Kirim pertanyaan ke server
    fetch('http://127.0.0.1:8081/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: question })
    })
    .then(response => response.json())  // Mengambil respons JSON dari server
    .then(data => {
      // Cek apakah ada jawaban di dalam data yang diterima
      if (data && data.answer && data.answer.parts && data.answer.parts.length > 0) {
        const answerText = data.answer.parts[0].text;

        const convertHTML = marked.parse(answerText)

        document.getElementById('output-bot').innerHTML = convertHTML;
      } else {
        document.getElementById('output-bot').innerText = 'Tidak ada jawaban yang ditemukan.';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('output-bot').innerText = 'Terjadi kesalahan saat mendapatkan jawaban.';
    });
  });
  
  