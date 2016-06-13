# Serverless MicroBlog

This is an example project to demonstrate serverless coding with Firebase.

## Local development

1. Clone the repo
2. Install dependencies
```sh
npm install && bower install
```
3. Insert your Firebase Database credentials here (in this README):

```
FIREBASE_PROJECT_ID: MY-PROJECT-ID
FIREBASE_API_KEY: MY-API-KEY
```

Or you can also export them as environment variables

```sh
export FIREBASE_PROJECT_ID=MY-PROJECT-ID
export FIREBASE_API_KEY=MY-API-KEY
```

4. Run the dev server with livereload
```sh
npm run dev
```

## Deployment

To deploy this under your own Firebase project,
create .firebaserc -file in the project directory
with following content:

```
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

Then build the assets and deploy to hosting:

```sh
npm run deploy
```

Also you can deploy better rules (database.rules.json) for the database (Recommended)

```sh
firebase deploy --only database
```
