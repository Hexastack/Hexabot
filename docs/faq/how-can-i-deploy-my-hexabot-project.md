# How can I deploy my Hexabot Project?

### Introduction

This documentation explains how to deploy your Hexabot project using two different methods:

1. [**Using Nginx as a service and Certbot for SSL.**](how-can-i-deploy-my-hexabot-project.md#using-nginx-as-a-service-and-certbot-for-ssl)
2. [**Using Dockerized Nginx and Certbot services.**](how-can-i-deploy-my-hexabot-project.md#using-dockerized-nginx-and-certbot-services)

### Pre-requisites

Make sure you have access to a server running a Linux distribution with SSH enabled. The following documentation is based on an Ubuntu distribution, so you may need to adapt the steps according to your specific operating system.

***

### **Using Nginx as a service and Certbot for SSL**

#### Step 1: Install Docker

{% content-ref url="../developer-guide/setting-up-docker-for-development-and-production.md" %}
[setting-up-docker-for-development-and-production.md](../developer-guide/setting-up-docker-for-development-and-production.md)
{% endcontent-ref %}

#### Step 2: Install NPM

{% content-ref url="../developer-guide/setup-node.js-with-nvm.md" %}
[setup-node.js-with-nvm.md](../developer-guide/setup-node.js-with-nvm.md)
{% endcontent-ref %}

#### Step 3: Setup Hexabot project

1. Install the Hexabot CLI:

```bash
npm install -g hexabot-cli
```

2. Create new project:

```bash
 hexabot create my-chatbot
 cd my-chatbot/
```

&#x20;Or clone an existing project of yours:

```bash
 git clone git@github.com:YOUR_ORG/my-chatbot.git
 cd my-chatbot/
```

3. Environment Setup:

To configure the environment variables, use the following command:

```bash
hexabot init
```

This command will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist

4. Update your `.env` file for production, especially the following ones:

<table><thead><tr><th>Variable Name</th><th>Example Value</th><th>Env variable description</th><th data-hidden></th></tr></thead><tbody><tr><td>NODE_ENV</td><td>prod</td><td>Environment Mode</td><td></td></tr><tr><td>APP_DOMAIN</td><td>mychatbot.ai</td><td>Application Domain Name</td><td></td></tr><tr><td>API_ORIGIN</td><td>https://mychatbot.ai/api</td><td>The api endpoint will be used to communicate with the backend</td><td></td></tr><tr><td>FRONTEND_ORIGIN</td><td>https://mychatbot.ai</td><td>The origins that will be accepted by the API</td><td></td></tr><tr><td>JWT_SECRET</td><td>346998ba1f171f107433</td><td>Secret to encrypt jwt token</td><td></td></tr><tr><td>SESSION_SECRET</td><td>27feaf70d2c78892bf49</td><td>Secret to encrypt session token</td><td></td></tr><tr><td>HTTPS_ENABLED</td><td>true</td><td>Https setting</td><td></td></tr><tr><td>INVITATION_JWT_SECRET</td><td>51c8ea00d82eb10ee226</td><td>Secret to encrypt invitation token</td><td></td></tr><tr><td>PASSWORD_RESET_JWT_SECRET</td><td>5ee97916017176d1ca6c</td><td>Secret to encrypt reset password token</td><td></td></tr><tr><td>CONFIRM_ACCOUNT_SECRET</td><td>80f74dce70e5385bf80b</td><td>Secret to encrypt confirm account token</td><td></td></tr><tr><td>MONGO_USER</td><td>my_mongo_username</td><td>Mongodb username</td><td></td></tr><tr><td>MONGO_PASSWORD</td><td>my_mongo_password</td><td>Mongodb password</td><td></td></tr><tr><td>AUTH_TOKEN</td><td>c97643c1c1e5e9dc5745</td><td>Secret to encrypt NLU token</td><td></td></tr><tr><td>NEXT_PUBLIC_API_ORIGIN</td><td>https://mychatbot.ai/api</td><td>Nextjs api endpoint</td><td></td></tr></tbody></table>

Note that you can also adjust the default token expirations durations as needed.

{% hint style="info" %}
To be able to send email you will need to configure SMTP. Learn how to configure SMTP environment variables by following our detailed [SMTP setup guide](../developer-guide/smtp-configuration-and-emails.md)[.](../developer-guide/smtp-configuration-and-emails.md)
{% endhint %}

5. Run your Hexabot project in production mode:

```bash
hexabot start
# Or include additional services you may want to use
hexabot start --services nlu,ollama,influxdb
```

Note that this command will start all the services (api, frontend, mongodb, ...) as Docker containers.

#### Step 4: Install Nginx

Deploying an Hexabot project on production requires you to setup a HTTP Web Server like Apache2, HAProxy or Nginx to secure communications using SSL, establish access per domain name, and a lot of other capabilities such as rate limiting for example to help protect against abuse and prevent server overload. In this guide, we will walk you through a typical HTTP Web Server setup using Nginx and Certbot for SSL certificate generation.

1. Update the system:

```bash
sudo apt update
```

2. Install Nginx:

```bash
sudo apt install nginx
```

3. Verify the Nginx installation:

```bash
nginx -v
```

4. Start Nginx:

```bash
sudo systemctl start nginx
```

5. Check the Nginx status:

```bash
sudo systemctl status nginx
```

***

#### Step 5: Configure Nginx

1. Replace Nginx server configuration with the following : **/etc/nginx/sites-available/default**.

```bash
server {
    listen 80;
    server_name mychatbot.ai; # You will need to update this to use your own domain 
    server_tokens off;
    client_max_body_size 20M;

    location / {
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Url-Scheme $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        proxy_pass http://localhost:8080; # Make sure to use the port configured in .env file
    }

    location /api/ {
        rewrite ^/api/?(.*)$ /$1 break;
        proxy_pass http://localhost:4000; # Make sure to use the port configured in .env file
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header X-NginX-Proxy false;
        proxy_pass_request_headers on;
    }

    location ~* \.io {
        rewrite ^/api/?(.*)$ /$1 break;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy false;

        proxy_pass http://localhost:4000; # Make sure to use the port configured in .env file
        proxy_redirect off;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### Step6: Generate SSL certificate using Certbot

1. Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain an SSL certificate:

```bash
sudo certbot --nginx
```

3. (Optional) Automate SSL renewal:

```bash
sudo crontab -e
```

4. Add the following line:

```
0 12 * * * certbot renew --quiet
```

**Step 7: Reload Nginx with new configuration**

1. Test configuration syntax:

```bash
sudo nginx -t
```

If you get an error please make sure you don't have any syntax error in `/etc/nginx/sites-available/default`

2. Reload Nginx with new configuration:

```bash
sudo systemctl reload nginx
```

***

Access your domain using HTTPS (eg. https://mychatbot.ai) to check if you have successfully deployed your Hexabot project using Nginx!  🚀🎉. Feel free to ask for support from the community on our Discord channel.

## **Using Dockerized Nginx and Certbot services** :

The second deployment method, where everything is Dockerized, is still WIP.
