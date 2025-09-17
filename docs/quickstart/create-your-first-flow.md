---
icon: arrow-progress
---

# Create your first flow

This interactive tutorial will guide you through the process of building your first chatbot flow using our intuitive visual editor. No coding experience is required – just follow the steps below, and you'll have your chatbot first flow up and running in no time.

{% @supademo/embed demoId="cm1tjkxgn01jcjca2ufvh7l62" url="https://app.supademo.com/demo/cm1tjkxgn01jcjca2ufvh7l62" %}

This is just a basic example to get you started. Hexabot offers a wide range of features and blocks to create more complex and engaging chatbot flows. Explore the different block types, experiment with NLU features, and integrate with your content sources to build a chatbot that truly meets your needs.

{% hint style="warning" %}
## **Prerequisites**

Before you begin creating conversation flows with NLU triggers, ensure you have the following prerequisites in place:

#### 1. Configured NLU Engine

You need a fully configured and running NLU (Natural Language Understanding) engine to use intent-based triggers in your conversation flows. The NLU engine is responsible for understanding user intents from natural language input. For detailed instructions on configuring your NLU engine refer to our [NLU Engines](../user-guide/nlu/nlu-engines/) documentation page.

#### 2. Populated NLU Entities Database

Your NLU entities database should be populated with the necessary entities and values that your chatbot will use to extract information from user messages. This includes defining entity types (Trait, Keyword, or Pattern entities) and their associated values.

For detailed instructions managing NLU entities, refer to our [Manage NLU Entities](../user-guide/nlu/manage-nlu-entities.md) documentation page.



**Without a properly configured NLU engine and populated entities database, NLU-based triggers (like "Intent Match") will not function correctly in your conversation flows.**
{% endhint %}

#### **0. Ent**er your login credentials.

{% hint style="info" %}
Default admin account credentials are&#x20;

**Login :** admin@admin.admin

Pa**ssword :** adminadmin
{% endhint %}

<figure><img src="https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/QuSr-J9L-S4OZpC6Ouy9s.jpg&#x26;x=2435&#x26;y=1025&#x26;fill=009185&#x26;color=009185" alt=""><figcaption></figcaption></figure>

#### 1. Go to Hexabot visual editor page. This is your main workspace where you can build your chatbot conversation flow. In this tutorial, we will design a chatbot that can answer question about a company return policy.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/hgU8qwtDbLiBmmO-mWrXk.jpeg\&x=2054\&y=713\&fill=009185\&color=009185)

#### 2. Click 'Simple Text' to insert a new block in your workspace.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/xf_5jG03onF6ELW5dFg2V.jpg\&x=147\&y=364\&fill=009185\&color=009185)

#### 3. Double-click on a block to begin making changes

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/10b-S_Za0xipN0LOQUi6h.jpg\&x=2470\&y=983\&fill=009185\&color=009185)

#### 4. Add a descriptive block title relevant to this step in the flow.

![](<../.gitbook/assets/Screenshot from 2024-12-13 15-18-42.png>)

#### 5. Toggle the switch to set this block as a starting step in the conversation.

![](<../.gitbook/assets/Screenshot from 2024-12-13 15-17-24.png>)

#### 6. You can trigger blocks based on custom conditions. Click 'NEW TRIGGER' to create a new one.

![](<../.gitbook/assets/Screenshot from 2024-12-13 15-27-35.png>)

#### 7. Select 'Intent Match' from the dropdown to create a condition based on natural language understanding.

![](<../.gitbook/assets/Screenshot from 2024-12-13 16-07-27.png>)

#### 8. Intent Match triggers can detect the user's intent, even if the message is in different words or forms.

![](<../.gitbook/assets/Screenshot from 2024-12-13 16-15-08.png>)

#### 9. Let's start by adding a greeting intent as a trigger, since this is the beginning of our conversation. You can also combine multiple triggers for more complex scenarios.

![](<../.gitbook/assets/Screenshot from 2024-12-13 16-20-17.png>)

#### 10. Click to select the intent 'greetings\_hello' from the list.

![](<../.gitbook/assets/Screenshot from 2024-12-13 16-53-09.png>)

#### 11. Go to the 'Message' tab to configure responses.

![](<../.gitbook/assets/Screenshot from 2024-12-13 16-57-30.png>)

#### 12. Expand this section to view the replacement tokens.

![](<../.gitbook/assets/Screenshot from 2024-12-13 17-12-02.png>)

#### 13. Select the first name replacement token

![](<../.gitbook/assets/Screenshot from 2024-12-13 17-19-55.png>)

#### 14. Copy the token

![](<../.gitbook/assets/Screenshot from 2024-12-13 17-22-09.png>)

#### 15. To customize the reply message, edit the response to 'Hi {context.user.first\_name} !'

![](<../.gitbook/assets/Screenshot from 2024-12-13 17-28-57.png>)

#### 16. Hit the submit button to save the block setup

![](<../.gitbook/assets/Screenshot from 2024-12-13 17-30-54.png>)

#### 17. To test your conversation flow, open the chat widget launcher.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/ETeTXnEkIaoeV0HQr05oz.jpg\&x=3696\&y=1920\&fill=009185\&color=009185)

#### 18. Type any form of greeting to trigger a reply from the chatbot.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/MdfwqPTCgqOIp89b18WA3.jpg\&x=2909\&y=1928\&fill=009185\&color=009185)

#### 19. Return to the blocks library and add a Quick Reply block to your flow.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/6JyaPTeo_3xmR2Sk8C-Wv.jpg\&x=151\&y=624\&fill=009185\&color=009185)

#### 20. Double-click on the block to customize it.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/70glz_-zfifRTaxIvdGPH.jpg\&x=2259\&y=979\&fill=009185\&color=009185)

#### 21. Let's modify the trigger to use natural language understanding (NLU) instead of basic keyword matching.

![](<../.gitbook/assets/Screenshot from 2024-12-16 08-28-21.png>)

![](<../.gitbook/assets/Screenshot from 2024-12-16 08-28-53.png>)

#### 23. We've previously created a new intent in our NLU provider, specifically designed to identify when a user inquires about our return policy. If you want to use this intent or define a new one in your own chatbot, you'll need to train Hexabot's NLU engine. Learn more about this feature in the [nlu-training.md](../user-guide/nlu-training.md "mention") guide:

![](<../.gitbook/assets/Screenshot from 2024-12-16 09-41-35.png>)

#### 24. Set this block as the starting point. Multiple blocks can serve as entry points in your flow.

![](<../.gitbook/assets/Screenshot from 2024-12-16 09-39-42.png>)

#### 25. Go to the 'Message' tab to configure responses for this block.

![](<../.gitbook/assets/Screenshot from 2024-12-16 09-45-10 (2).png>)

#### 26. Customize the response message by replacing the default content.

![](<../.gitbook/assets/Screenshot from 2024-12-16 09-50-34.png>)

#### 27. Add quick replies. Each reply will be an option the user can click instead of typing.

![](<../.gitbook/assets/Screenshot from 2024-12-16 09-53-07.png>)

![](<../.gitbook/assets/Screenshot from 2024-12-16 09-59-06.png>)

![](<../.gitbook/assets/Screenshot from 2024-12-16 10-02-16.png>)

#### 30. Save your changes, then link the blocks together

![](<../.gitbook/assets/Screenshot from 2024-12-16 10-03-50.png>)

#### 31. Try out the new block by asking a question about the return policy in the chat widget.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/_B8qgX_zbZmhglVQwq-u_.jpg\&x=2910\&y=1930\&fill=009185\&color=009185)

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/zJKxHebaVYMptZ9uagudh.jpg\&x=2910\&y=1506\&fill=009185\&color=009185)

#### 33. Depending on the user's response, we'll provide different answers. Let's add a new block to continue building our flow

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/BUnMj6j56W7cdla5jAwQX.jpg\&x=146\&y=322\&fill=009185\&color=009185)

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/436OvEZVj-iCPCQMKXFnM.jpg\&x=2796\&y=734\&fill=009185\&color=009185)

#### 35. Let's name this block Return Eligibility

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/8AxxnrgwPgOkJRKcCj-sK.jpg\&x=1505\&y=576\&fill=009185\&color=009185)

#### 36. Go to triggers tab

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/KFtJMTT9skBhT3YyoqHhn.jpg\&x=1042\&y=763\&fill=009185\&color=009185)

#### 37. Our keyword trigger should match the option we added in the quick replies block

![](<../.gitbook/assets/Screenshot from 2024-12-16 10-05-51.png>)

#### 38. Click on "Message".

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/UQ_BeniZYiF6iIHBuFSrg.jpg\&x=1707\&y=743\&fill=009185\&color=009185)

#### 39. And provide the appropriate message or messages

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/1jKLy9HJlze8fSlmDgKHt.jpg\&x=1559\&y=1087\&fill=009185\&color=009185)

#### 40. Save and connect the block to the Quick Replies block to continue the conversation flow.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/zTNdIk0zKaftH-jxCWGdH.jpg\&x=2614\&y=1706\&fill=009185\&color=009185)

#### 41. Go back to the chat widget

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/LggaLSXimY_OSChbnqBpl.jpg\&x=2882\&y=1920\&fill=009185\&color=009185)

#### 42. Click on "Return Eligibility".

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/LggaLSXimY_OSChbnqBpl.jpg\&x=3104\&y=1815\&fill=009185\&color=009185)

#### 43. 🎉 By following this flow, the user was able to receive accurate information about return eligibility from the chatbot.

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/j4VsCqh31Gouy_xYnEuES.jpg\&x=2923\&y=1652\&fill=009185\&color=009185)

#### 44. You can add more blocks to cover the other options like "Refund Timeframe" and "Other" by creating connecting a new block and repeating the same steps

![](https://d16ev9qffqt5qm.cloudfront.net/?s3_key=cm13fx1ui000ykz7ijmdsawl9/1vjudS6Zw3gKe4x98h1cq.jpg\&x=268\&y=801\&fill=009185\&color=009185)
