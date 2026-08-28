# AI-Based Instagram Engagement Prediction and Content Optimization System

## 1. Project Overview

The **AI-Based Instagram Engagement Prediction and Content Optimization
System** is a web-based application developed to predict the potential
engagement level of Instagram content and provide recommendations for
improving content performance.

The system combines **Machine Learning, image processing, text analysis
and web technologies** to analyse Instagram-related content. Users can
submit captions, hashtags, account information, posting information and
images to obtain an engagement prediction, confidence information and
content optimization recommendations.

## 2. Main Objectives

-   Predict the engagement level of Instagram content.
-   Analyse captions and hashtags.
-   Extract useful features from uploaded images.
-   Provide content optimization recommendations.
-   Generate an optimization score.
-   Store and retrieve prediction history.
-   Manage user reminders.
-   Export prediction results as PDF reports.
-   Provide administrative user-management functionality.

## 3. Main Features

### User Features

-   User registration and login
-   User authentication
-   Profile management
-   Instagram content submission
-   Image upload and processing
-   Engagement prediction
-   Prediction confidence
-   Caption analysis
-   Hashtag analysis
-   Image analysis
-   Content optimization recommendations
-   Optimization score
-   Prediction history
-   Reminder management
-   PDF report export

### Administrative Features

-   Admin authentication and authorization
-   View registered users
-   View user details
-   User management and deletion
-   Administrative API functionality

## 4. System Architecture

The system follows a web-based architecture consisting of:

-   **Frontend:** React.js
-   **Backend:** Flask / Python
-   **Machine Learning:** Python-based trained classification model
-   **Authentication:** Firebase Authentication
-   **Database:** Firebase Firestore
-   **File/Image Storage:** Firebase Storage
-   **Communication:** REST API and JSON
-   **Report Generation:** Python-based PDF generation

Main prediction workflow:

`React Frontend → Flask Backend → Feature Mapping/Processing → Machine Learning Model → Prediction & Confidence → Content Optimization → React Frontend`

## 5. Machine Learning Pipeline

The machine learning component uses a production feature schema
containing **56 features**. Submitted Instagram content is processed and
mapped into the required feature structure before being passed to the
trained model.

The prediction pipeline includes:

1.  Receive Instagram content from the frontend.
2.  Process caption and hashtag information.
3.  Process account and posting information.
4.  Process the uploaded image and image-related features.
5.  Map the processed information to the production feature schema.
6.  Validate the 56-feature input vector.
7.  Load and execute the trained machine learning model.
8.  Generate the predicted engagement class.
9.  Calculate prediction probabilities and confidence.
10. Generate content optimization results.
11. Return the results to the React frontend.
12. Store prediction information for future history viewing.

## 6. Dataset

The project initially investigated and tested **secondary
Instagram-related datasets obtained from publicly available online
sources**.

During experimentation, the available datasets were found to be large
and computationally demanding for the available PC hardware. Due to
dataset size, processing time and hardware performance limitations, a
suitable **synthetic dataset** was generated for the main model
development and experimentation.

The synthetic dataset follows the required feature structure for the
proposed Instagram engagement prediction system. Exploratory Data
Analysis (EDA), preprocessing, feature engineering, model training,
cross-validation, hyperparameter tuning and final model evaluation were
performed using the prepared dataset.

## 7. Project Structure

The exact structure may vary depending on the development environment,
but the project is organised around the following major components:

``` text
AI-Instagram-Engagement-Prediction/
├── frontend/              # React frontend
├── backend/               # Flask backend and ML prediction services
├── model/                 # Trained model and production resources
├── data/                  # Dataset-related files
├── notebooks/             # Data analysis and ML notebooks
├── reports/               # Project documentation
└── README.md
```

## 8. Running the System

### Backend

Open a terminal in the backend directory and create or activate the
Python virtual environment used for the project.

Install the required Python dependencies:

``` bash
pip install -r requirements.txt
```

Configure the required Firebase credentials and environment variables
before starting the backend.

Run the Flask application using the project's configured entry point.

### Frontend

Open another terminal in the frontend directory and install the required
Node.js packages:

``` bash
npm install
```

Start the React development application:

``` bash
npm start
```

The frontend communicates with the Flask backend through the configured
API endpoints.

> **Note:** Do not commit Firebase private credentials, API keys, `.env`
> files or other sensitive configuration files to the repository.

## 9. Testing

The completed system was tested using **29 test cases** covering the
main functional and integration areas of the application.

Testing included:

-   User registration and login
-   Profile management
-   Instagram content processing
-   Image upload and processing
-   Machine learning prediction
-   Prediction confidence
-   Content optimization
-   Prediction history
-   Reminder functionality
-   PDF export
-   Administrative functionality
-   React--Flask integration
-   Authentication and access control
-   Error handling

All **29 test cases passed successfully**, and no functional issues were
identified during the completed testing process.

## 10. Technologies Used

  Technology                           Purpose
  ------------------------------------ -----------------------------------------
  React.js                             Frontend user interface
  Flask                                Backend REST API
  Python                               Machine learning and backend processing
  Firebase Authentication              User authentication
  Firebase Firestore                   Application data storage
  Firebase Storage                     Image/file storage
  Machine Learning                     Engagement prediction
  Computer Vision / Image Processing   Image feature extraction
  REST API                             Frontend--backend communication
  JSON                                 Data exchange
  PDF Generation                       Prediction report export
  Git / GitHub                         Version control and source management

## 11. Project Documentation

The project documentation includes:

-   Literature review
-   System requirements
-   System design
-   Architecture and UML diagrams
-   Dataset and methodology
-   Exploratory Data Analysis
-   Data preprocessing and feature engineering
-   Model training and evaluation
-   System implementation
-   Testing and test cases
-   Conclusion and future recommendations

## 12. Future Improvements

Possible future improvements include:

-   Training with larger and more diverse real-world Instagram datasets.
-   Direct integration with Instagram APIs where permitted.
-   Further improvement of image and natural-language analysis.
-   Additional machine learning and deep learning approaches.
-   More advanced personalized content recommendations.
-   Mobile application support.
-   Real-time analytics and monitoring.

## 13. Author

This project was developed as an academic final project demonstrating
the integration of **Machine Learning and full-stack web application
development** for Instagram engagement prediction and content
optimization.
