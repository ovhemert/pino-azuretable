# CLI

To use `pino-azuretable` from the command line, you need to install it globally:

```bash
$ npm install -g pino-azuretable
```

## Example

Given an application `foo` that logs via pino, you would use `pino-azuretable` like so:

```bash
$ node foo | pino-azuretable --account storageaccount --key blablabla
```

## Usage

You can pass the following options via cli arguments:

| Short command | Full command | Description |
| ------------- | ------------ |-------------|
| -V | --version | Output the version number |
| -a | --account &lt;account&gt; | The name of the Azure Storage Account |
| -k | --key &lt;key&gt; | The access key of the Azure Storage Account|
| -t | --table &lt;table&gt; | The name of the table to storage the messages in |
| -p | --partition &lt;partition&gt; | The partition key to use in the table |
| -b | --batch &lt;size&gt; | The number of log messages to send as a single batch (defaults to 1) |
| -h | --help | Output usage information |

See the [API](./API.md) documentation for details.
