# Setting Up Docker for Development and Production

Hexabot uses Docker for development purposes as well as streamline deployment, running essential services like the API, frontend, and MongoDB in containers. The provided Docker Compose setup ensures quick and consistent startup, eliminating manual configuration complexities.

{% hint style="info" %}
The following is an example on how to install Docker on a Ubuntu machine. If you have a different OS, please check the official guide on how to install Docker on your system [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)&#x20;
{% endhint %}

1. Set up Docker's apt repository:

```bash
 # Add Docker's official GPG key:
 sudo apt-get update
 sudo apt-get install ca-certificates curl
 sudo install -m 0755 -d /etc/apt/keyrings
 sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
 sudo chmod a+r /etc/apt/keyrings/docker.asc

 # Add the repository to Apt sources:
 echo 
 \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
 $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
 sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
 
 sudo apt-get update
```

2. Install Docker Community Edition:

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

3. Check if Docker is running:

<pre class="language-bash"><code class="lang-bash"><strong>sudo systemctl status docker
</strong></code></pre>

4. Add your user to the Docker group:

```bash
sudo usermod -aG docker $USER
```

5. To apply the new group membership, log out of the server and back in, or type the following:

```bash
su - ${USER}
```
