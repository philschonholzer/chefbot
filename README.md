# ChefBot

## Bot verwenden

Bot in die gewünschten Channels einladen. Er frägt dann täglich die User dieser Channels was sie heute gemacht haben.

### Rapportieren

Rapportieren mit einem Channelname ("#" nicht vergessen) und falls gewüsncht einer Dauer. Falls keine Dauer angegeben wird wird 4h genommen.

### Auslesen

Bot direkt ansprechen mit "übersicht", "total", "projekt", "tage" oder "arbeit". Danach gibt er an wie lange an den unterschiedlichen Projekten gearbeitet wurde.


## Technik

Bot ist in TypeScript basierend auf Node.js geschrieben. Als DB wird Redis verwendet.

### Lokal ausführen

ENV für Redis, Slack-Token und eigener Slack-Channel setzen.
z.B.

```json
"token": "slack-token",
"REDIS_URL": "redis://redis:6379",
"admin": "C0XJG50EN",
"NODE_ENV": "development"
```

`npm install`

`npm start`

### Tests

`npm test`

### Docker

`docker build -t chefbot .`

`docker run --name redis -v /data -p 6379:6379 -d redis:alpine redis-server --save 900 1` 
With saving every 15min. Add -p 6379:6379 if you want to reach redis from the host.

`docker run --name app -d --link redis -e "token=slack-token" chefbot`

