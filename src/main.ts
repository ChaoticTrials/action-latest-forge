import * as core from '@actions/core';
import { parseStringPromise } from 'xml2js';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const settings: ActionSettings = {
      mcVersion: core.getInput('minecraft-version'),
      forgeType: (core.getInput('forge-type') as 'forge' | 'neoforge') || 'neoforge',
      channel: (core.getInput('channel') as 'latest' | 'recommended') || 'latest',
      latest: core.getBooleanInput('latest') || true
    };

    let version: string | Error = '';
    if (settings.forgeType === 'neoforge') {
      version = await getNeoForge(settings);
    }

    if (settings.forgeType === 'forge') {
      version = await getForge(settings);
    }

    if (version === '') {
      core.setFailed(`Invalid forge type '${settings.forgeType}'`);
      return;
    }

    if (version instanceof Error) {
      core.setFailed(version.message);
      return;
    }

    core.debug(`Final version: ${version}`);
    core.setOutput('version', version);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

async function getNeoForge(settings: ActionSettings): Promise<string | Error> {
  const url = 'https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return new Error(`HTTP error! status: ${response.status}`);
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml);

    core.debug('XML Result:');
    core.debug(JSON.stringify(result, null, 2));

    const versions: string[] = result.metadata.versioning[0].versions[0].version;

    core.debug('Parsed Versions:');
    core.debug(JSON.stringify(versions, null, 2));

    const mcVersion = settings.mcVersion.split('.').length === 2 ? `${settings.mcVersion}.0` : settings.mcVersion;
    core.debug(`Minecraft Version: ${mcVersion}`);

    const searchVersion = mcVersion.substring(mcVersion.indexOf('.') + 1);
    const filteredVersions = versions.filter(version => version.startsWith(searchVersion));
    core.debug(`Search version: ${searchVersion}`);

    core.debug(`Possible versions: ${filteredVersions}`);
    const latestVersion = filteredVersions[filteredVersions.length - 1];
    if (settings.channel === 'latest') {
      core.debug(`Found latest version ${latestVersion}`);
      return latestVersion;
    }

    const recommendedVersions = filteredVersions.filter(version => !version.includes('beta'));
    const recommendedVersion = recommendedVersions[recommendedVersions.length - 1];

    core.debug(`Recommended Version: ${recommendedVersion}`);
    return settings.latest ? recommendedVersion || latestVersion : recommendedVersion;
  } catch (error) {
    return error instanceof Error ? error : new Error('Failed to fetch XML data');
  }
}

async function getForge(settings: ActionSettings): Promise<string | Error> {
  const url = 'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json';

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return new Error(`Failed to fetch promotions from ${url}`);
    }

    const forgeResponse = (await response.json()) as ForgeResponse;

    const versionKey = settings.mcVersion + '-' + settings.channel;
    let version = forgeResponse.promos[versionKey];

    if (!version && settings.channel === 'recommended' && settings.latest) {
      version = forgeResponse.promos[settings.mcVersion + '-latest'];
    }

    if (!version) {
      return new Error(`Forge version '${versionKey}' not found.`);
    }

    return version;
  } catch (error) {
    return error instanceof Error ? error : new Error('An unexpected error occurred.');
  }
}

interface ActionSettings {
  mcVersion: string;
  forgeType: 'forge' | 'neoforge';
  channel: 'latest' | 'recommended';
  latest: boolean;
}

interface ForgeResponse {
  homepage: string;
  promos: ForgePromos;
}

interface ForgePromos {
  [key: string]: string;
}
