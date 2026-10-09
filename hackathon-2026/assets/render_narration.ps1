param(
  [Parameter(Mandatory = $true)]
  [string]$TimelinePath,
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$timeline = Get-Content -Raw -Path $TimelinePath | ConvertFrom-Json
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$voices = [System.Speech.Synthesis.SpeechSynthesizer]::new().GetInstalledVoices()
$preferred = $voices |
  Where-Object { $_.VoiceInfo.Culture.Name -eq "en-US" } |
  Select-Object -First 1
if (-not $preferred) {
  $preferred = $voices | Select-Object -First 1
}
if (-not $preferred) {
  throw "No Windows speech synthesis voice is installed."
}

for ($index = 0; $index -lt $timeline.scenes.Count; $index++) {
  $scene = $timeline.scenes[$index]
  $output = Join-Path $OutputDirectory ("{0:D2}-{1}.wav" -f $index, $scene.id)
  $synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
  try {
    $synth.SelectVoice($preferred.VoiceInfo.Name)
    $synth.Rate = 2
    $synth.Volume = 100
    $synth.SetOutputToWaveFile($output)
    $synth.Speak([string]$scene.caption)
  }
  finally {
    $synth.Dispose()
  }
}

Write-Output ("Rendered {0} narration clips with voice '{1}'." -f $timeline.scenes.Count, $preferred.VoiceInfo.Name)
