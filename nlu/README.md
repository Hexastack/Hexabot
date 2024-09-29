# Hexabot NLU

The [Hexabot](https://hexabot.ai/) NLU (Natural Language Understanding) engine is a Python-based project that provides tools for building, training, and evaluating machine learning models for natural language tasks such as intent detection and language recognition. It also includes a REST API for inference, built using FastAPI.

## Directory Structure
- **/run.py:** The CLI tool that provides commands for training, evaluating, and managing models.
- **/models:** Contains the different model definitions and logic for training, testing, and evaluation.
- **/data:** Placeholder for datasets used during training and evaluation.
- **/experiments:** Placeholder for stored models generated during training.
- **/data_loaders:** Classes that define the way to load datasets to be used by the different models.
- **/main.py:** The FastAPI-based REST API used for inference, exposing endpoints for real-time predictions.

## Setup

**No dependencies needed besides Python 3.11.6, virtualenv, and TensorFlow.** Start developing your new model on top of this workflow by cloning this repository:

```bash
# Set up a virtualenv
pip install virtualenv

python3.11 -m venv venv

source env.sh

pip install -r requirements.txt
```

## Directory structure

- `data`: gitignore'd, place datasets here.
- `experiments`: gitignore'd, trained models written here.
- `data_loaders`: write your data loaders here.
- `models`: write your models here.


## Usage

**Check `models/mlp.py` and `data_loaders/mnist.py` for fully working examples.**

You should run `source env.sh` on each new shell session. This activates the virtualenv and creates a nice alias for `run.py`:
```bash
$ cat env.sh
source venv/bin/activate
alias run='python run.py'
```

Most routines involve running a command like this:
```bash
# Usage: run [method] [save_dir] [model] [data_loader] [hparams...]
run fit myexperiment1 mlp mnist --batch_size=32 --learning_rate=0.1
```

Examples :
```bash
# Intent classification
run fit intent-classifier-en-30072024 intent_classifier  --intent_num_labels=88 --slot_num_labels=17 --language=en
run predict intent-classifier-fr-30072024  --intent_num_labels=7 --slot_num_labels=2 --language=fr

# Language classification
run fit language-classifier-26082023 tflc
run predict language-classifier-26082023
run evaluate language-classifier-26082023
```

where the `model` and `data_loader` args are the module names (i.e., the file names without the `.py`). The command above would run the Keras model's `fit` method, but it could be any custom as long as it accepts a data loader instance as argument.

**If `save_dir` already has a model**:
- Only the first two arguments are required and the data loader may be changed, but respecifying the model is not allowed-- the existing model will always be used.
- Specified hyperparameter values in the command line WILL override previously used ones
(for this run only, not on disk).


### `tfbp.Model`

Models pretty much follow the same rules as Keras models with very slight differences: the constructor's arguments should not be overriden (since the boilerplate code handles instantiation), and the `save` and `restore` methods don't need any arguments.

```python
import tensorflow as tf
import boilerplate as tfbp

@tfbp.default_export
class MyModel(tfbp.Model):
    default_hparams = {
        "batch_size": 32,
        "hidden_size": 512,
        "learning_rate": 0.01,
    }

    # Don't mess with the args and keyword args, `run.py` handles that.
    def __init__(self, *a, **kw):
        super().__init__(*a, **kw)

        self.dense1 = tf.keras.layers.Dense(self.hparams.hidden_size)
        ...

    def call(self, x):
        z = self.dense1(x)
        ...
```

You can also write your own training loops à la pytorch by overriding the `fit` method
or writing a custom method that you can invoke via `run.py` simply by adding the
`@tfbp.runnable` decorator. Examples of both are available in `models/mlp.py`.

### `tfbp.DataLoader`

Since model methods invoked by `run.py` receive a data loader instance, you may name your data loader methods whatever you wish and call them in your model code. A good practice is to make the data loader handle anything that is specific to a particular dataset, which allows the model to be as general as possible.

```python
import tensorflow as tf
import boilerplate as tfbp

@tfbp.default_export
class MyDataLoader(tfbp.DataLoader):
    default_hparams = {
        "batch_size": 32,
    }

    def __call__(self):
        if self.method == "fit":
            train_data = tf.data.TextLineDataset("data/train.txt").shuffle(10000)
            valid_data = tf.data.TextLineDataset("data/valid.txt").shuffle(10000)
            return self.prep_dataset(train_data), self.prep_dataset(valid_data)

        elif self.method == "eval":
            test_data = tf.data.TextLineDataset("data/test.txt")
            return self.prep_dataset(test_data)

    def prep_dataset(self, ds):
        return ds.batch(self.hparams.batch_size).prefetch(1)
```

### API
API is built using FastAPI : https://fastapi.tiangolo.com/

Run the dev server in standalone with:
```sh
ENVIRONMENT=dev uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Run the project with Docker : 
```sh
docker compose -f "docker-compose.yml" up -d --build
```

## Pushing models to HuggingFace

Please refer to official HF documentation on how to host models : https://huggingface.co/docs/hub/en/repositories-getting-started

What is important to note is that big files should be tracked with git-lfs, which you can initialize with:

```
git lfs install
```

and if your files are larger than 5GB you’ll also need to run:

```
huggingface-cli lfs-enable-largefiles .
```

## Contributing 
We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

## License
This software is licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:

1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
