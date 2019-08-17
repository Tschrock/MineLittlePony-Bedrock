
Function Export-MCPack {
    <#
        .SYNOPSIS
        Packages a directory as a Minecraft Bedrock Edition Add-on.

        .DESCRIPTION
        The Export-MCPack cmdlet packages the specified directory into a Minecraft Bedrock Edition Add-on (.mcpack) file.

        .PARAMETER Path
        Specifies the path to the directory that you want to package.

        .PARAMETER DestinationPath
        Specifies the path to the directory where the packaged Add-on should be saved.

    #>

    Param (
        [Parameter(Mandatory = $true)] [string] $Path,
        [Parameter(Mandatory = $true)] [string] $DestinationPath
    )

    # Try to load the manifest
    $ManifestLocation = Join-Path $Path "manifest.json";

    if( -not ( Test-Path $ManifestLocation ) ) {
        Write-Error "Could not find a manifest file for '$Path'";
        return;
    }

    # Read the manifest
    $ManifestContent = Get-Content -Raw $ManifestLocation;
    $ManifestData = ConvertFrom-Json $ManifestContent;

    # Get the name & version
    $PackName = $ManifestData.header.name;
    $PackVersion = $ManifestData.header.version;

    # Build the export filename
    $PackCleanName = $PackName -replace "[^A-Za-z0-9]","";
    $PackVersionString = $PackVersion -join ".";

    $PackExportName = "$PackCleanName-v$PackVersionString";

    $PackExportPath = Join-Path $DestinationPath $PackExportName;

    # Make sure the output directory exists
    New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null;

    # Package the files
    Compress-Archive -Path $Path -DestinationPath "$PackExportPath.zip" -Force;

    # Rename the package
    Move-Item -Path "$PackExportPath.zip" -Destination "$PackExportPath.mcpack" -Force;

    Write-Host "Exported '$PackName v$PackVersionString' to '$PackExportPath.mcpack'.";

}

$OutputPath = Join-Path $PSScriptRoot "dist";
$ResourcePackFiles = Join-Path $PSScriptRoot "resource-pack";

Export-MCPack $ResourcePackFiles $OutputPath;
