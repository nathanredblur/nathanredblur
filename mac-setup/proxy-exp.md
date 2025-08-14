## Proxy experiment for bypassing vpn

### instructions
1. install tinyproxy with brew
   ```bash
   brew install tinyproxy
   ```
2. edit the config file
   ```bash
   code /opt/homebrew/etc/tinyproxy/tinyproxy.conf 
   ```
3. add this changes to the configuration
   ```bash
    Listen 0.0.0.0
    # Allow your local network, e.g.
    Allow 192.168.1.0/24
    # sometimes fails if is not used ip6
    Allow ::ffff:192.168.1.9
  ```
4. start tinyproxy
   ```bash
    # manually start tinyproxy
    tinyproxy -c /opt/homebrew/etc/tinyproxy/tinyproxy.conf
   
    # start in the background
    tinyproxy -c /opt/homebrew/etc/tinyproxy/tinyproxy.conf -d
    
    # start tinyproxy as a service
    brew services start tinyproxy
   ```
5. use proxy externally using your ip address
   ```bash
    # get your local ip address
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1

    # test the proxy
    curl -x http://<your-ip>:8888 https://ifconfig.me
    ```

   