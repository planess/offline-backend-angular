# Overview

This package helps to keep active development if internet connection is out for short time.

How it works: system collects all http-request when connection is on and use the last obtained
results replacing the real htt-requests by saved copies when internet connection it off.

# Setup

### Install the package

Run the command in your project:

```shell
npm install @planess/offline-network
```

### Invoke provider factory in NgModule

Append execution of special `configureOfflineNetwork` into main module provider (usually,
in `app.module.ts`):

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { configureOfflineNetwork } from '@planess/offline-network';
import { environment } from 'src/environments/environment';

@NgModule({
	providers: [configureOfflineNetwork(HTTP_INTERCEPTORS, { maxAge: 60 }, environment.production)],
})
export class AppModule {}
```

Syntax is:

```typescript
function configureOfflineNetwork(
	HTTP_INTERCEPTORS_FROM_THE_APP: typeof HTTP_INTERCEPTORS,
	configuration?: Partial<Configuration>,
	productionMode: boolean,
): Provider[];
```

, arguments:

- `HTTP_INTERCEPTORS_FROM_THE_APP` - original `HTTP_INTERCEPTORS` project's token for http-requests;
- `configuration` - _optional_ set of parameters. Details are below;
- `productionMode` - whether application is running in production mode. Module is disabled for
  production version.

# Configuration

You can pass `configuration` as a second argument with any number of properties with `Configuration`
interface:

- `maxAge`: `number = 48` - number of **hours** while cache is available
- `includeServerOff`: `boolean = false` - either server's 500 errors would use the cache. `true` -
  use cache!

# Changelogs

[Read the last changes](./CHANGELOG.md) if you need to upgrade package version.

# Want to help?

We would be grateful for any remarks, fix, comments, suggestions or contribution. You
can [fork the project](https://github.com/planess/offline-network-angular) and make helpful changes.
