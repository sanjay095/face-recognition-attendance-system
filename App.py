import csv
from flask import Flask, render_template, request, jsonify
import numpy as np
from tensorflow.keras.models import load_model
from PIL import Image
import cv2

app = Flask(__name__)

# Load the trained model
model_path = r"D:\Sam2\Capston2\Capston002\Capstone_Final_project\Face-Recognition-based-Attendance-System_model.h5"
model = load_model(model_path)

# Function to detect person and return the predicted label
def detect_person(image, model):
    # Preprocess the image
    img = cv2.resize(image, (224, 224))
    img = img / 255.0  

    # Reshape the image to match the input shape expected by the model
    img = np.expand_dims(img, axis=0)

    # Predict the label for the image
    prediction = model.predict(img)

    # Map the index to the actual label
    labels = ['Jasan', 'Jaspreet', 'Karan', 'Kunal', 'Mohit', 'Preyas', 'Princeton', 'Sanjay', 'Shaid', 'Vandana']  
    predicted_label_index = np.argmax(prediction)
    predicted_label = labels[predicted_label_index]

    return predicted_label

# Function to save attendance status to the CSV file
def save_to_csv(student_id, student_name, status):
    csv_file = 'attendance.csv'
    with open(csv_file, 'a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([student_id, student_name, status])

# Function to read attendance data from the CSV file
def read_attendance_csv():
    attendance_data = {}
    with open('attendance.csv', mode='r') as file:
        reader = csv.reader(file)
        for row in reader:
            student_id, student_name, status = row
            attendance_data[student_id] = {'name': student_name, 'status': status}
    return attendance_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/check_presence', methods=['POST'])
def check_presence():
    try:
        image_file = request.files['image']
        student_name = request.form['name']  # Get student's name
        image_stream = Image.open(image_file.stream)
        image = np.array(image_stream)

        # Detect person using the model
        status = detect_person(image, model)
        
        # Save student's name and status to CSV
        save_to_csv('temp_image', student_name, status)  

        return jsonify({'status': status})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/register_student', methods=['POST'])
def register_student():
    try:
        student_name = request.form['name']
        student_id = request.form['id']

        if not student_name or not student_id:
            return jsonify({'error': 'Both name and ID are required'}), 400

        # Save student's name and initial status to CSV
        save_to_csv(student_id, student_name, 'Absent')  

        return jsonify({'message': 'Student registered successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5004)
