# from typing import Union
import asyncio
import os
from typing import Annotated, Union
from fastapi.responses import JSONResponse
import boilerplate as tfbp
from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel
import logging
from huggingface_hub import login

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

AUTH_TOKEN = os.getenv("AUTH_TOKEN", "TOKEN_MUST_BE_DEFINED")

AVAILABLE_LANGUAGES = os.getenv("AVAILABLE_LANGUAGES", "en,fr").split(',')
TFLC_REPO_ID = os.getenv("TFLC_REPO_ID")
INTENT_CLASSIFIER_REPO_ID = os.getenv("INTENT_CLASSIFIER_REPO_ID")
SLOT_FILLER_REPO_ID = os.getenv("SLOT_FILLER_REPO_ID")
HF_AUTH_TOKEN = os.getenv("HF_AUTH_TOKEN")

# Log in to HuggingFace using the provided access token
if HF_AUTH_TOKEN:
    login(token=HF_AUTH_TOKEN)

def load_language_classifier():
    # Init language classifier model
    Model = tfbp.get_model("tflc")
    kwargs = {}
    model = Model("", method="predict", repo_id=TFLC_REPO_ID, **kwargs)
    model.load_model()
    logging.info(f'Successfully loaded the language classifier model')
    return model

def load_intent_classifiers():
    Model = tfbp.get_model("intent_classifier")
    intent_classifiers = {}
    for language in AVAILABLE_LANGUAGES:
        kwargs = {}
        intent_classifiers[language] = Model(save_dir=language, method="predict", repo_id=INTENT_CLASSIFIER_REPO_ID, **kwargs)
        intent_classifiers[language].load_model()
        logging.info(f'Successfully loaded the intent classifier {language} model')
    return intent_classifiers

def load_slot_fillers():
    Model = tfbp.get_model("slot_filler")
    slot_fillers = {}
    for language in AVAILABLE_LANGUAGES:
        kwargs = {}
        slot_fillers[language] = Model(save_dir=language, method="predict", repo_id=SLOT_FILLER_REPO_ID, **kwargs)
        slot_fillers[language].load_model()
        logging.info(f'Successfully loaded the slot filler {language} model')
    return slot_fillers


def load_models():
    app.language_classifier = load_language_classifier()  # type: ignore
    app.intent_classifiers = load_intent_classifiers()  # type: ignore
    app.slot_fillers = load_slot_fillers()  # type: ignore

app = FastAPI()


def authenticate(
    token: str
):
    if token != AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized access",
        )
    return True


class ParseInput(BaseModel):
    q: str
    project: Union[str, None] = None


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(asyncio.to_thread(load_models))


@app.get("/health", status_code=200,)
async def check_health():
    return "Startup checked"


@app.post("/parse")
def parse(input: ParseInput, is_authenticated: Annotated[str, Depends(authenticate)]):
    if not hasattr(app, 'language_classifier') or not hasattr(app, 'intent_classifiers') or not hasattr(app, 'slot_fillers'):
        headers = {"Retry-After": "120"}  # Suggest retrying after 2 minutes
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"message": "Models are still loading, please retry later."}, headers=headers)
    
    language_prediction = app.language_classifier.get_prediction(input.q)  # type: ignore
    language = language_prediction.get("value")
    intent_prediction = app.intent_classifiers[language].get_prediction(
        input.q)  # type: ignore
    slot_prediction = app.slot_fillers[language].get_prediction(
        input.q)  # type: ignore

    if slot_prediction.get("entities"):
        entities = slot_prediction.get("entities")
    else:
        entities = []
    
    entities.append(language_prediction)

    return {
        "text": input.q,
        "intent": intent_prediction.get("intent"),
        "entities": entities,
    }
