import tensorflow as tf

import boilerplate as tfbp


@tfbp.default_export
class MNIST(tfbp.DataLoader):
    default_hparams = {"batch_size": 32}

    def __call__(self):
        train_data, test_data = tf.keras.datasets.mnist.load_data()
        test_data = tf.data.Dataset.from_tensor_slices(test_data)

        if self.method in ["fit", "train"]:
            train_data = tf.data.Dataset.from_tensor_slices(train_data).shuffle(10000)
            test_data = test_data.shuffle(10000)
            train_data = self._transform_dataset(train_data)
            return train_data, test_data

        return self._transform_dataset(test_data)

    def _transform_dataset(self, dataset):
        dataset = dataset.batch(self.hparams.batch_size)
        return dataset.map(
            lambda x, y: (
                tf.reshape(tf.cast(x, tf.float32) / 255.0, [-1, 28 * 28]), # type: ignore
                tf.cast(y, tf.int64),
            )
        )
