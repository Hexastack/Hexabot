# How can I deploy my Hexabot using NGINX ?

### Introduction

This documentation outlines two methods for deploying your Hexabot project in a production environment using NGINX and Let's Encrypt for SSL certificate :&#x20;

1. [**Method 1: Using Nginx as a service and Certbot for SSL**](how-can-i-deploy-my-hexabot-using-nginx.md#method-1-using-nginx-as-a-service-and-certbot-for-ssl)
2. [**Method 2: Using Dockerized Nginx and Certbot services**](how-can-i-deploy-my-hexabot-using-nginx.md#method-2-using-dockerized-nginx-and-certbot-services)

### Pre-requisites

Before starting, ensure you have the following:

#### **Step 1: Server Requirements**

* A server running a Linux distribution with SSH enabled.
* These instructions are based on Ubuntu, so adapt as needed for other distributions.

#### Step 2: Install Required Software

* #### Install Docker

{% content-ref url="../developer-guide/setting-up-docker-for-development-and-production.md" %}
[setting-up-docker-for-development-and-production.md](../developer-guide/setting-up-docker-for-development-and-production.md)
{% endcontent-ref %}

* #### Install NPM

{% include "../.gitbook/includes/untitled.md" %}

***

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

<table><thead><tr><th width="310">Variable Name</th><th>Example Value</th><th>Env variable description</th><th data-hidden></th></tr></thead><tbody><tr><td>NODE_ENV</td><td>prod</td><td>Environment Mode</td><td></td></tr><tr><td>APP_DOMAIN</td><td>mychatbot.ai</td><td>Application Domain Name</td><td></td></tr><tr><td>API_ORIGIN</td><td>https://mychatbot.ai/api</td><td>The API endpoint will be used to communicate with the backend</td><td></td></tr><tr><td>FRONTEND_BASE_URL</td><td>https://mychatbot.ai</td><td>The API endpoint will be used to communicate with the frontend</td><td></td></tr><tr><td>FRONTEND_ORIGIN</td><td>http://mychatbot.ai, https://mychatbot.ai</td><td>The origins that will be accepted by the API. A list of permitted origins for cross-origin requests</td><td></td></tr><tr><td>NEXT_PUBLIC_API_ORIGIN</td><td>https://mychatbot.ai/api</td><td>Next.js API endpoint</td><td></td></tr><tr><td>JWT_SECRET</td><td>346998ba1f171f107433</td><td>Secret to encrypt JWT token</td><td></td></tr><tr><td>SESSION_SECRET</td><td>27feaf70d2c78892bf49</td><td>Secret to encrypt session token</td><td></td></tr><tr><td>HTTPS_ENABLED</td><td>true</td><td>Https setting</td><td></td></tr><tr><td>INVITATION_JWT_SECRET</td><td>51c8ea00d82eb10ee226</td><td>Secret to encrypt invitation token</td><td></td></tr><tr><td>PASSWORD_RESET_JWT_SECRET</td><td>5ee97916017176d1ca6c</td><td>Secret to encrypt reset password token</td><td></td></tr><tr><td>CONFIRM_ACCOUNT_SECRET</td><td>80f74dce70e5385bf80b</td><td>Secret to encrypt confirm account token</td><td></td></tr><tr><td>MONGO_USER</td><td>my_mongo_username</td><td>Mongodb username</td><td></td></tr><tr><td>MONGO_PASSWORD</td><td>my_mongo_password</td><td>Mongodb password</td><td></td></tr><tr><td>AUTH_TOKEN</td><td>c97643c1c1e5e9dc5745</td><td>Secret to encrypt NLU token</td><td></td></tr></tbody></table>

Note that you can also adjust the default token expirations durations as needed.

{% hint style="info" %}
To be able to send email you will need to configure SMTP. Learn how to configure SMTP environment variables by following our detailed [SMTP setup guide](../developer-guide/smtp-configuration-and-emails.md)[.](../developer-guide/smtp-configuration-and-emails.md)
{% endhint %}

### **Method 1 : Using Nginx as a service and Certbot for SSL**

#### Step 1: Run your Hexabot project in production mode:

{% hint style="info" %}
If you're starting with a fresh installation and not using a DB backup, it's recommended to run Hexabot in development mode the first time. This allows for automatic seeding of essential data into the DB.
{% endhint %}

```bash
hexabot start
# Or include additional services you may want to use
hexabot start --services nlu,ollama,influxdb
```

Note that this command will start all the services (api, frontend, mongodb, ...) as Docker containers.

#### Step 2: Install Nginx

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

#### Step 3: Configure Nginx

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

#### Step 4: Generate SSL certificate using Certbot

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

**Step 5: Reload Nginx with new configuration**

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

## **Method 2: Using Dockerized Nginx and Certbot services** :

This guide will help you set up Nginx with SSL using Docker and Certbot for your Hexabot project.

#### Step 1: Copy Required Files for Dockerized Nginx and Certbot

To use the Dockerized version of Nginx and Certbot:

1. Download the following files from the Hexabot GitHub repository:
   * docker/nginx
   * docker/docker-compose.nginx.yml
   * docker/docker-compose.nginx.prod.yml
   * docker/init-letsencrypt.sh
2. Copy these files under the `my-chatbot/docker` directory of your project.

#### Step 2: Initialize SSL with Certbot

1. Navigate to the `my-chatbot/docker` directory:

```sh
cd my-chatbot/docker
```

2. **Optional**: If you'd like to test your setup without hitting request limits for SSL certificates, set the staging variable to 1 in the `init-letsencrypt.sh` script before running it:

```sh
staging=1
```

After confirming the setup, set the `staging` variable back to `0` to request live certificates.

3. Run the `init-letsencrypt.sh` script:

Make sure to set the `APP_DOMAIN` variable to your application domain name in the`.env` file. It's recommended also to use a valid email address so make sure to set the `SSL_EMAIL` variable as well.

```sh
APP_DOMAIN=mychatbot.ai
SSL_EMAIL=hello@hexabot.ai
```

You can test the DNS configuration by running one of these commands:

```sh
nslookup mychatbot.ai
```

Or

```sh
dig mychatbot.ai
```

Make the `init-letsencrypt.sh` script executable by granting it execute permissions.

```sh
chmod +x init-letsencrypt.sh
```

Now you will be able to run the script

```sh
./init-letsencrypt.sh
```

#### Step 3: Verify Deployment

Once the script completes, run `docker ps` verify that your Nginx and Certbot docker containers are up and running. Access your Hexabot instance via the domain you specified (e.g., `https://mychatbot.ai`) to check if SSL certificates have been generated and are properly installed.
