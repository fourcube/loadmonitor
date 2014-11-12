# loadmonitor

Listen for loadagents to send response information. Stores run data inside MongoDB.

## Running

Create a `settings.json` file with the dbURL to connect to.

```
{
	"dbURL": "mongodb://<dbuser>:<dbpassword>@ds033380.mongolab.com:33380/loadmonitor"
}
```

Then you can run loadmonitor with

```
npm install
node src/app.js
```