# Run the App

```
# Spin Databases up
$ docker-compose up

# Install the Dependencies
$ npm install

# Run the app in dev mode
$ npm run start:dev

# Build the app
$ npm run Build

# Run Built app
$ npm run start

# Run tests - Must have Docker db up
$ npm run test
```

TODO:

- [] Locking (db/redis/mutex) so that when two users attempt to book a same parking spot within the overlapping time frame
