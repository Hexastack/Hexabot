# Context Variables

<figure><img src="../.gitbook/assets/image (1) (1).png" alt=""><figcaption></figcaption></figure>

Context variables are powerful tools in Hexabot that allow you to store and manage information gathered during a conversation with a user. This information can then be used to personalize the chatbot's responses, make decisions within the conversation flow, or trigger specific actions.

Think of context variables as temporary storage containers that hold data specific to a particular conversation. For example, you could store the user's name, their preferred language, or their order details.

**1. Access Context Variables page:**

* Navigate to the "Context Vars" or "Context Variables" section. This is typically found in the main menu.

**2. Creating a New Context Variable:**

* **Click "Add Context Variable" or a similar button:** This will open a form where you can define a new context variable.
* **Provide Variable label:** Choose a descriptive label for your variable, reflecting the type of information it will store. For example:
  * user\_name
  * preferred\_language
  * order\_id
  * location
* **Save Changes:** Click the "Submit" button to create your new context variable.

**3. Managing Existing Context Variables:**

* **View Existing Variables:** In the "Context Vars" section, you can view a list of the context variables you've created.
* **Edit Variable label:** You can edit a variable's label. However, you cannot change it name once it's created.
* **Delete a Variable:** If a context variable is no longer needed, you can delete it from the list. Be careful because deleting a variable will remove all data stored within it.

**3. Using Context Variables:**

Once a context variable is defined, you can edit a given block's options and add that context variable to capture the user input message. In the following example, we will collect the phone number entered by the user.

<figure><img src="../.gitbook/assets/image (18).png" alt=""><figcaption><p>Capture Context Variables</p></figcaption></figure>

Once the block gets triggered, the value will be stored within the context variable and you would be able to access it through the context. For example, you can use it in a text message by injecting `{phone_number}` and it will be replace automatically by the value that has been captured:&#x20;

<figure><img src="../.gitbook/assets/image (19).png" alt=""><figcaption><p>Using Context Variables</p></figcaption></figure>



{% hint style="info" %}
**Additional Notes**

Context variables are temporary and are specific to a single conversation. They are not shared between different conversations.
{% endhint %}
