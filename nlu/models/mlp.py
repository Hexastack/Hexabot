import tensorflow as tf
from keras import layers as tfkl

import boilerplate as tfbp


@tfbp.default_export
class MLP(tfbp.Model):
    default_hparams = {
        "layer_sizes": [512, 10],
        "learning_rate": 0.001,
        "num_epochs": 10,
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.forward = tf.keras.Sequential()

        for hidden_size in self.hparams.layer_sizes[:-1]:
            self.forward.add(tfkl.Dense(hidden_size, activation=tf.nn.relu))

        self.forward.add(
            tfkl.Dense(self.hparams.layer_sizes[-1], activation=tf.nn.softmax)
        )

        self.loss = tf.losses.SparseCategoricalCrossentropy()
        self.optimizer = tf.optimizers.Adam(self.hparams.learning_rate)

    def call(self, x):
        return self.forward(x)

    @tfbp.runnable
    def fit(self, data_loader):
        """Example using keras training loop."""
        train_data, valid_data = data_loader.load()

        self.compile(self.optimizer, self.loss)
        super().fit(
            x=train_data,
            validation_data=valid_data,
            validation_steps=32,  # validate 32 batches at a time
            validation_freq=1,  # validate every 1 epoch
            epochs=self.hparams.num_epochs,
            shuffle=False,  # dataset instances already handle shuffling
        )
        self.save()

    @tfbp.runnable
    def train(self, data_loader):
        """Example using custom training loop."""
        step = 0
        train_data, valid_data = data_loader()

        # Allow to call `next` builtin indefinitely.
        valid_data = iter(valid_data.repeat())

        for epoch in range(self.hparams.num_epochs):
            for x, y in train_data:

                with tf.GradientTape() as g:
                    train_loss = self.loss(y, self(x))

                grads = g.gradient(train_loss, self.trainable_variables)
                self.optimizer.apply_gradients(zip(grads, self.trainable_variables))

                # Validate every 1000 training steps.
                if step % 1000 == 0:
                    x, y = next(valid_data)
                    valid_loss = self.loss(y, self(x))
                    print(
                        f"step {step} (train_loss={train_loss} valid_loss={valid_loss})"
                    )
                step += 1

            print(f"epoch {epoch} finished")
            self.save()

    @tfbp.runnable
    def evaluate(self, data_loader):
        n = 0
        accuracy = 0
        test_data = data_loader()
        for x, y in test_data:
            true_pos = tf.math.equal(y, tf.math.argmax(self(x), axis=-1))
            for i in true_pos.numpy():
                n += 1
                accuracy += (i - accuracy) / n
        print(accuracy)
