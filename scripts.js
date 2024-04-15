document.addEventListener('DOMContentLoaded', function () {
    // Get references to HTML elements
    const captureBtn = document.getElementById('captureBtn');
    const resultDiv = document.getElementById('result');
    const registerBtn = document.getElementById('registerBtn');
    const checkAttendanceBtn = document.getElementById('checkAttendanceBtn');
    const nameInput = document.getElementById('name');
    const idInput = document.getElementById('id');
    let videoStream = null;

    // Event listener for the capture button
    captureBtn.addEventListener('click', async () => {
        try {
            if (!videoStream) {
                // Get video stream from the webcam if not already initialized
                videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            // Capture an image from the webcam
            const imageBlob = await captureImage(videoStream);

            // Display the captured image
            const imageUrl = URL.createObjectURL(imageBlob);
            resultDiv.innerHTML = `<img src="${imageUrl}" alt="Captured Image" style="max-width: 100%;">`;

            // Send the image to the server for processing
            const formData = new FormData();
            formData.append('image', imageBlob);
            formData.append('name', nameInput.value.trim());

            const response = await fetch('/check_presence', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            // Save the status to the resultDiv dataset
            resultDiv.dataset.status = data.status;

            // Display the status received from the server
            resultDiv.innerHTML += `<p>Status: ${data.status}</p>`;

            // Stop the video stream to release the webcam
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        } catch (error) {
            console.error('Error capturing image:', error);
            resultDiv.innerHTML = 'Error capturing image. Please try again.';
        }
    });

    // Function to capture an image from the webcam
    async function captureImage(stream) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.play();

        // Wait for the video to load and display it on a canvas
        return new Promise((resolve, reject) => {
            videoElement.addEventListener('loadeddata', () => {
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

                // Convert canvas content to Blob (image)
                canvas.toBlob(resolve, 'image/jpeg');
            });
            videoElement.addEventListener('error', (err) => reject(err));
        });
    }

    // Event listener for the register button
    registerBtn.addEventListener('click', async () => {
        try {
            const name = nameInput.value.trim();
            const id = idInput.value.trim();

            if (!name || !id) {
                resultDiv.innerHTML = 'Please enter both name and ID.';
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('id', id);

            const response = await fetch('/register_student', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            resultDiv.innerHTML = `<p>${data.message}</p>`;
            
            // Clear input fields after successful registration
            nameInput.value = '';
            idInput.value = '';

        } catch (error) {
            console.error('Error registering student:', error);
            resultDiv.innerHTML = 'Error registering student. Please try again.';
        }
    });

    // Event listener for the button to check attendance
    checkAttendanceBtn.addEventListener('click', async () => {
        try {
            const id = idInput.value.trim();
            const name = nameInput.value.trim();

            if (!id || !name) {
                resultDiv.innerHTML = 'Please enter both name and ID.';
                return;
            }

            const status = resultDiv.dataset.status;

            resultDiv.innerHTML += `<p>Attendance Status for ${name}: ${status}</p>`;
        } catch (error) {
            console.error('Error checking attendance:', error);
            resultDiv.innerHTML = 'Error checking attendance. Please try again.';
        }
    });
});
