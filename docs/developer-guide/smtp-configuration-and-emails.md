---
icon: envelope
---

# SMTP Configuration and Emails

{% hint style="info" %}
Make sure you have a **.env** file created under the `docker/` folder. You can either copy .env.example or run `hexabot init` to create that file. The **.env** file contains environment variables that we use for configuring the Hexabot instance.
{% endhint %}

## **Development Environment**

You have two options for handling email functionality during development:

1. **Without SMTP**:\
   You can run the app without using SMTP by setting the environment variable `EMAIL_SMTP_ENABLED=false`. Simply run `hexabot start` and invite a new user. The app will behave as though it is sending emails, but nothing will happen in the background.
2. **Using smtp4dev for Testing**:\
   We use `smtp4dev` for email testing in the development environment. To use this service, set the `EMAIL_SMTP_ENABLED` to `true` in the `.env` file and restart the app using the command `hexabot start --services smtp4dev`. Then, invite a new user or reset a password and check whether emails are received in the smtp4dev UI interface at [http://localhost:9002/](http://localhost:9002/). This also applies to other scenarios like the confirmation email after signup and the password reset email.

**SMTP Config (Local Dev)**

For local development with `smtp4dev`, configure the following environment variables:

```makefile
APP_SMTP_4_DEV_PORT=9002
EMAIL_SMTP_ENABLED=true
EMAIL_SMTP_HOST=smtp4dev
EMAIL_SMTP_PORT=25
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=dev_only
EMAIL_SMTP_PASS=dev_only
EMAIL_SMTP_FROM=noreply@example.com
```

## **Production Environment**

In production, use a third-party SMTP service by configuring the environment variables before running `hexabot start`, here is an example:

```makefile
EMAIL_SMTP_ENABLED=true
EMAIL_SMTP_HOST=sandbox.smtp.mailtrap.io
EMAIL_SMTP_PORT=2525
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=***************
EMAIL_SMTP_PASS=***************
EMAIL_SMTP_FROM=from@example.com
```

## **Customizing Email Templates**

Email templates are located in the `api/src/templates` folder. These templates are written in **MJML syntax** (you can read more about [MJML here](https://mjml.io/)).

## **Translations**

Email strings are translated using the i18n system. You can find the translation files in the `api/src/config/i18n` folder.
