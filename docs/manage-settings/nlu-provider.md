# NLU Provider

Hexabot comes equipped with a built-in NLU (Natural Language Understanding) engine, which helps your chatbot understand the intent behind user messages. You can configure the NLU settings to tailor its behavior. This guide walks you through managing the NLU Provider settings in Hexabot.

**1. Access NLU Provider Settings:**

* Log in to your Hexabot account.
* Go to the "Settings" page.
* Select the "NLU Provider" section.

**2. Configure Default Language:**

* **Choose Default Language:** Select the primary language that your chatbot should use for understanding user input. This setting defines the default language that the NLU engine will use for interpretation.

**3. Adjust the Fallback Threshold:**

* **Fallback Confidence Threshold:** This setting controls how confident the NLU engine needs to be about its predictions before taking action.
  * **Threshold Value:** The threshold is a value between 0 and 1 (inclusive).
  * **Interpretation:** A higher threshold requires a greater degree of certainty from the NLU engine, potentially leading to more accurate but more conservative responses. A lower threshold allows for more flexibility, but may increase the likelihood of errors or inaccurate interpretations.
