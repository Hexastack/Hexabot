"""TensorFlow Boilerplate main module."""

from collections import namedtuple
import json
import os
import sys

import tensorflow as tf
from huggingface_hub import snapshot_download
import logging

# Set up logging configuration
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')


def Hyperparameters(value):
    """Turn a dict of hyperparameters into a nameduple.

    This method will also check if `value` is a namedtuple, and if so, will return it
    unchanged.

    """
    # Don't transform `value` if it's a namedtuple.
    # https://stackoverflow.com/questions/2166818/how-to-check-if-an-object-is-an-instance-of-a-namedtuple
    t = type(value)
    b = t.__bases__
    if len(b) == 1 and b[0] == tuple:
        fields = getattr(t, "_fields", None)
        if isinstance(fields, tuple) and all(type(name) == str for name in fields):
            return value

    _Hyperparameters = namedtuple("Hyperparameters", value.keys())
    return _Hyperparameters(**value)

def validate_and_get_project_name(repo_name):
    """
    Validate a HuggingFace repository name and return the project name.
    
    Parameters:
        repo_name (str): The repository name in the format 'Owner/ProjectName'.
        
    Returns:
        str: The project name if the repo_name is valid.
        
    Raises:
        ValueError: If the repo_name is not in the correct format.
    """
    # Check if the repo name contains exactly one '/'
    if repo_name.count('/') != 1:
        raise ValueError("Invalid repository name format. It must be in 'Owner/ProjectName' format.")
    
    # Split the repository name into owner and project name
    owner, project_name = repo_name.split('/')
    
    # Validate that both owner and project name are non-empty
    if not owner or not project_name:
        raise ValueError("Invalid repository name. Both owner and project name must be non-empty.")
    
    # Return the project name if the validation is successful
    return project_name


class Model(tf.keras.Model):
    """Keras model with hyperparameter parsing and a few other utilities."""

    default_hparams = {}
    _methods = {}

    def __init__(self, save_dir=None, method=None, repo_id=None, **hparams):
        super().__init__()

        self._method = method
        self.hparams = {**self.default_hparams, **hparams}
        self.extra_params = {}
        self._ckpt = None
        self._mananger = None
        self._repo_id = None

        if repo_id is not None:
            project_name = validate_and_get_project_name(repo_id)
            self._repo_id = repo_id
            self._repo_dir = os.path.join("repos", project_name)
            if save_dir is not None:
                self._save_dir = os.path.join("repos", project_name, save_dir)
            else:
                self._save_dir = os.path.join("repos", project_name)
            
            self.load_model()
        else:
            self._save_dir = save_dir

        if self._save_dir is None:
            raise ValueError(
                f"save_dir must be supplied."
            )

        # If the model's hyperparameters were saved, the saved values will be used as
        # the default, but they will be overriden by hyperparameters passed to the
        # constructor as keyword args.
        hparams_path = os.path.join(self._save_dir, "hparams.json")
        if os.path.isfile(hparams_path):
            with open(hparams_path) as f:
                self.hparams = {**json.load(f), **hparams}
        else:
            if not os.path.exists(self._save_dir):
                os.makedirs(self._save_dir)
            with open(hparams_path, "w") as f:
                json.dump(self.hparams._asdict(), f, indent=4,  # type: ignore
                          sort_keys=True)

        # If the model's has extra parameters, the saved values will be loaded
        extra_params_path = os.path.join(self._save_dir, "extra_params.json")
        if os.path.isfile(extra_params_path):
            with open(extra_params_path) as f:
                self.extra_params = {**json.load(f)}

    @property
    def method(self):
        return self._method

    @property
    def hparams(self):
        return self._hparams

    @hparams.setter
    def hparams(self, value):
        self._hparams = Hyperparameters(value)

    @property
    def extra_params(self):
        return self._extra_params

    @extra_params.setter
    def extra_params(self, value):
        self._extra_params = value

    @property
    def save_dir(self):
        return self._save_dir

    def save(self):
        """Save the model's weights."""
        if self._ckpt is None:
            self._ckpt = tf.train.Checkpoint(model=self)
            self._manager = tf.train.CheckpointManager(
                self._ckpt, directory=self.save_dir, max_to_keep=1
            )
        self._manager.save()

        # Save extra parameters
        if self.save_dir:
            extra_params_path = os.path.join(
                self.save_dir, "extra_params.json")
            with open(extra_params_path, "w") as f:
                json.dump(self.extra_params, f, indent=4, sort_keys=True)

    def restore(self):
        """Restore the model's latest saved weights."""
        if self._ckpt is None:
            self._ckpt = tf.train.Checkpoint(model=self)
            self._manager = tf.train.CheckpointManager(
                self._ckpt, directory=self.save_dir, max_to_keep=1
            )
        self._ckpt.restore(self._manager.latest_checkpoint).expect_partial()

        extra_params_path = os.path.join(self.save_dir, "extra_params.json")
        if os.path.isfile(extra_params_path):
            with open(extra_params_path) as f:
                self.extra_params = json.load(f)

    def make_summary_writer(self, dirname):
        """Create a TensorBoard summary writer."""
        return tf.summary.create_file_writer(os.path.join(self.save_dir, dirname))  # type: ignore

    def load_model(self):
        if not os.path.isfile(os.path.join(self._save_dir, "checkpoint")):
            os.makedirs(self._repo_dir, exist_ok=True)
            snapshot_download(repo_id=self._repo_id, force_download=True,
                              local_dir=self._repo_dir, repo_type="model")

        self.restore()


class DataLoader:
    """Data loader class akin to `Model`."""

    default_hparams = {}

    def __init__(self, method=None, **hparams):
        self._method = method
        self.hparams = {**self.default_hparams, **hparams}

    @property
    def method(self):
        return self._method

    @property
    def hparams(self):
        return self._hparams

    @hparams.setter
    def hparams(self, value):
        self._hparams = Hyperparameters(value)


def runnable(f):
    """Mark a method as runnable from `run.py`."""
    setattr(f, "_runnable", True)
    return f


def default_export(cls):
    """Make the class the imported object of the module and compile its runnables."""
    sys.modules[cls.__module__] = cls
    for name, method in cls.__dict__.items():
        if "_runnable" in dir(method) and method._runnable:
            cls._methods[name] = method
    return cls


def get_model(module_str):
    """Import the model in the given module string."""
    return getattr(__import__(f"models.{module_str}"), module_str)


def get_data_loader(module_str):
    """Import the data loader in the given module string."""
    return getattr(__import__(f"data_loaders.{module_str}"), module_str)
