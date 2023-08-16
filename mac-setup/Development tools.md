### Common build tools

```bash
brew install awscli pkg-config cmake
```

### MySQL

```bash
	brew install mysql mysql-client
```
Find your config file
`mysql --help | grep 'my.cnf'`

Edit your my.cnf file to match the following:

```
[mysqld]

# Disable strict mode
sql-mode=""

# Prevent external access
bind-address=127.0.0.1
mysqlx-bind-address = 127.0.0.1

# Allow large string
sort_buffer_size = 64000000
```

and run the following commands:

```bash
brew services restart mysql
```

### Redis

```bash
brew install redis
brew services start redis 
```

### Ruby
  
```bash
brew install rbenv ruby-build
echo 'eval "$(rbenv init -)"' >> ~/.zprofile

rbenv install 2.7.7
rbenv global 2.7.7

gem install bundler
```

