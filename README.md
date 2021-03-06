# ChefBot

## Bot verwenden

Bot in die gewünschten Channels einladen. Er frägt dann täglich die User dieser Channels was sie heute gemacht haben.

### Rapportieren

Rapportieren mit einem Channelname ("#" nicht vergessen) und falls gewünscht einer Dauer. Falls keine Dauer angegeben wird wird 4h genommen.

### Auslesen

Bot direkt ansprechen mit "übersicht", "total", "projekt", "tage" oder "arbeit". Danach gibt er an wie lange an den unterschiedlichen Projekten gearbeitet wurde.


## Technik

Bot ist in TypeScript basierend auf Node.js geschrieben. Als DB wird Redis verwendet.

### Lokal ausführen

ENV für Redis, Slack-Token und eigener Slack-Channel setzen.
z.B.

```json
"token": "slack-token",
"REDIS_URL": "redis://redis-chefbot:6379",
"admin": "C0XJG50EN",
"NODE_ENV": "development"
```

`npm install`

`npm start`

### Tests

```bash
# Start redis
docker run -d -v /data --network="host" redis:alpine redis-server --save 900 1

# Start test env
docker run -it -v /e/Dev/ChefBot:/bot --rm --network="host" mhart/alpine-node sh
cd bot
npm test
```

### Docker

```bash
# Docker Compose (empfohlen)
docker-compose up -d --build
```

### Google Cloud

```bash
docker build -t eu.gcr.io/demoinstances-1289/chefbot:[tag] .
gcloud compute ssh demo
gcloud docker push eu.gcr.io/demoinstances-1289/chefbot:[tag]
sudo docker run --name redis-chefbot -v /data -d --restart=always redis:alpine redis-server --save 900 1
sudo docker run --name chefbot -d --restart=always --link redis-chefbot:redis -e "token=slack-token" eu.gcr.io/demoinstances-1289/chefbot:[tag]
```

#### Backup

```bash
# Backup
sudo docker run --rm --volumes-from redis-chefbot -v $(pwd):/backup busybox tar cvf /backup/dump.tar /data

# Copy to local machine
gcloud compute copy-files demo:~/dump.tar .

# Restore
sudo docker run --rm --volumes-from redis-chefbot -v $(pwd):/backup busybox tar xvf /backup/dump.tar
# Verify
sudo docker run --rm --volumes-from ca.redis-dumps busybox ls -l  /data
```

#### Redis Query

```bash
sudo docker run --name redis-client --link redis-chefbot:redis -it --rm redis:alpine redis-cli -h redis
```