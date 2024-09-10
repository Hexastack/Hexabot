"""Generic script to run any method in a TensorFlow model."""

from argparse import ArgumentParser
import json
import os
import sys

import boilerplate as tfbp


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            "Usage:\n  New run: python run.py [method] [save_dir] [model] [data_loader]"
            " [hyperparameters...]\n  Existing run: python run.py [method] [save_dir] "
            "[data_loader]? [hyperparameters...]",
            file=sys.stderr,
        )
        exit(1)

    # Avoid errors due to a missing `experiments` directory.
    if not os.path.exists("experiments"):
        os.makedirs("experiments")

    # Dynamically parse arguments from the command line depending on the model and data
    # loader provided. The `method` and `save_dir` arguments are always required.
    parser = ArgumentParser()
    parser.add_argument("method", type=str)
    parser.add_argument("save_dir", type=str)

    # If modules.json exists, the model and the data loader modules can be inferred from
    # `save_dir`, and the data loader can be optionally changed from its default.
    #
    # Note that we need to use `sys` because we need to read the command line args to
    # determine what to parse with argparse.
    modules_json_path = os.path.join("experiments", sys.argv[2], "modules.json")
    if os.path.exists(modules_json_path):

        with open(modules_json_path) as f:
            classes = json.load(f)

        Model = tfbp.get_model(classes["model"])
    else:
        Model = tfbp.get_model(sys.argv[3])

        parser.add_argument("model", type=str)

        if not os.path.exists(os.path.join("experiments", sys.argv[2])):
            os.makedirs(os.path.join("experiments", sys.argv[2]))

        with open(modules_json_path, "w") as f:
            json.dump(
                {"model": sys.argv[3]},
                f,
                indent=4,
                sort_keys=True,
            )

    args = {}
    saved_hparams = {}
    hparams_json_path = os.path.join("experiments", sys.argv[2], "hparams.json")
    if os.path.exists(hparams_json_path):
        with open(hparams_json_path) as f:
            saved_hparams = json.load(f)
    for name, value in Model.default_hparams.items():
        if name in saved_hparams:
            value = saved_hparams[name]
        args[name] = value

    # Add a keyword argument to the argument parser for each hyperparameter.
    for name, value in args.items():
        # Make sure to correctly parse hyperparameters whose values are lists/tuples.
        if type(value) in [list, tuple]:
            if not len(value):
                raise ValueError(
                    f"Cannot infer type of hyperparameter `{name}`. Please provide a "
                    "default value with nonzero length."
                )
            parser.add_argument(
                f"--{name}", f"--{name}_", nargs="+", type=type(value[0]), default=value
            )
        else:
            parser.add_argument(f"--{name}", type=type(value), default=value)

    # Collect parsed hyperparameters.
    FLAGS = parser.parse_args()
    kwargs = {k: v for k, v in FLAGS._get_kwargs()}
    for k in ["model", "save_dir"]:
        if k in kwargs:
            del kwargs[k]

    # Instantiate model and data loader.
    model = Model(os.path.join("experiments", FLAGS.save_dir), **kwargs)

    # Restore the model's weights, or save them for a new run.
    if os.path.isfile(os.path.join(model.save_dir, "checkpoint")):
        model.restore()
    else:
        model.save()

    # Run the specified model method.
    if FLAGS.method not in Model._methods:
        methods_str = "\n  ".join(Model._methods.keys())
        raise ValueError(
            f"Model does not have a runnable method `{FLAGS.method}`. Methods available:"
            f"\n  {methods_str}"
        )
    
    Model._methods[FLAGS.method](model)
