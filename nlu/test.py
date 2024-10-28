import mlflow
import pandas as pd

mlflow.set_tracking_uri("http://0.0.0.0:5001")
# Load the model from MLflow
# model_uri = f"runs:/{run.info.run_id}/intent_classifier_model"

model = mlflow.pyfunc.load_model(model_uri="models:/IntentClassifierModel/3")

# Wrap the text input in a DataFrame
input_text = pd.DataFrame({"text": ["ok"]})  # Adjust "text" if your model expects a different column name

# Make the prediction
prediction = model.predict(input_text)
print(prediction)