# Context Variables

<figure><img src="../.gitbook/assets/image (21).png" alt=""><figcaption><p>Manage Context Variables</p></figcaption></figure>

Context variables are powerful tools in Hexabot that allow you to store and manage information gathered during a conversation with a user. This information can then be used to personalize the chatbot's responses, make decisions within the conversation flow, or trigger specific actions.

Think of context variables as storage containers that hold data specific to a particular conversation. For example, you could store the user's name, their preferred language, or their order details.

### 1. Types of Context Variables

In Hexabot, context variables can be either **Permanent** or **Non-Permanent**, depending on whether you want the data to persist beyond the current conversation.

#### 1. Non-Permanent Context Variables

* **Temporary Storage**: Non-permanent context variables are stored in the conversation context.
* **Scope**: They are specific to the ongoing conversation and are lost once the conversation ends.
* **Use Case**: Ideal for storing temporary data that is relevant only during the current interaction.
* **Example**: If a bot asks a user for their current location during a session, the bot may store the response as a non-permanent context variable to use in the rest of the conversation.

#### 2. Permanent Context Variables

* **Persistent Storage**: Permanent context variables are stored in the subscriber context, which means they persist across multiple conversations.
* **Scope**: These variables retain their values even after a conversation has ended, allowing the bot to remember information about a user across different interactions.
* **Use Case**: Ideal for storing user preferences or information that should be remembered for future interactions.
* **Example**: If a user provides their preferred language or opts into notifications, the bot can store this preference permanently. The bot will retain this information for future use, without needing to ask the user again in subsequent conversations.

### **2. Access Context Variables page**

Navigate to the "Context Vars" or "Context Variables" section. This is typically found in the main menu.

### **3. Creating a New Context Variable**

* **Click "Add Context Variable" or a similar button:** This will open a form where you can define a new context variable.
* **Provide Variable label:** Choose a descriptive label for your variable, reflecting the type of information you would like to collect. For example:
  * Phone Number
  * Email
* **Set the "Permanent" Option**:
  * **Permanent**: Check this option if you want the variable to be stored permanently and persist across conversations.
  * **Non-Permanent**: Leave this option unchecked if you want the variable to be temporary and only last for the duration of the current conversation.
* **Save Changes:** Click the "Submit" button to create your new context variable.

### **4. Managing Existing Context Variables**

* **View Existing Variables:** In the "Context Vars" section, you can view a list of the context variables you've created.
* **Edit Variable label:** You can edit a variable's label. However, you cannot change it name once it's created.
* **Delete a Variable:** If a context variable is no longer needed, you can delete it from the list. Be careful because deleting a variable will remove all data stored within it.

### **5. Using Context Variables**

Once a context variable is defined, you can edit a given block's options and add that context variable to capture the user input message. In the following example, we will collect the phone number entered by the user.

<figure><img src="../.gitbook/assets/image (18).png" alt=""><figcaption><p>Capture Context Variables</p></figcaption></figure>

Once the block gets triggered, the value will be stored within the context variable and you would be able to access it through the context. For example, you can use it in a text message by injecting `{phone_number}` and it will be replace automatically by the value that has been captured:&#x20;

<figure><img src="../.gitbook/assets/image (19).png" alt=""><figcaption><p>Using Context Variables</p></figcaption></figure>

{% hint style="info" %}
**Additional Notes**

Context variables are temporary and are specific to a single conversation. They are not shared between different conversations.
{% endhint %}
