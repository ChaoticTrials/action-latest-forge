# Action Latest Forge

An action for retrieving the latest version of Forge or NeoForge for any
Minecraft version.

### Inputs

|        Name         |                                  Description                                  | Required |  Default   |
| :-----------------: | :---------------------------------------------------------------------------: | :------: | :--------: |
| `minecraft-version` |                 The Minecraft version to get the version for                  |   Yes    |            |
|    `forge-type`     |                         Either `forge` or `neoforge`                          |    No    | `neoforge` |
|      `channel`      |                       Either `latest` or `recommended`                        |    No    |  `latest`  |
|      `latest`       | Whether to return the `latest` version if no `recommended` version is present |    No    |   `true`   |

## Outputs

### `version`

The latest version of Forge or NeoForge for the specified Minecraft version and
channel.

## Example Workflow

```yaml
name: Get Latest Forge Version

on: [push]

jobs:
  get-latest-forge:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Get latest Forge version
        id: get-forge-version
        uses: your-username/action-latest-forge@v1
        with:
          minecraft-version: '1.16.5'
          forge-type: 'forge'
          channel: 'latest'

      - name: Display Forge version
        run:
          echo "The latest Forge version is ${{
          steps.get-forge-version.outputs.version }}"
```
