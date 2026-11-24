# Speaks each narration line to a WAV file with the voices built into Windows (Windows.Media.SpeechSynthesis, the
# engine Narrator uses; no network). Run with Windows PowerShell 5.1 (powershell.exe), which can call WinRT.
# Input: a JSON array of { file, voice, rate, text }. Lines whose WAV already exists are skipped.
# -List prints the installed voices instead.
param([string]$LinesJson, [switch]$List)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Wait-Op($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }

$all = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices
if ($List) { $all | ForEach-Object { "{0} | {1} | {2}" -f $_.DisplayName, $_.Gender, $_.Language }; return }

$lines = Get-Content -Raw -Encoding UTF8 $LinesJson | ConvertFrom-Json
$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$made = 0
foreach ($l in $lines) {
  if (Test-Path $l.file) { continue }
  $v = $all | Where-Object { $_.DisplayName -eq $l.voice } | Select-Object -First 1
  if (-not $v) { throw "Voice not installed: $($l.voice)" }
  $synth.Voice = $v
  $synth.Options.SpeakingRate = [double]$l.rate
  $stream = Wait-Op ($synth.SynthesizeTextToStreamAsync($l.text)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $n = [uint32]$stream.Size
  $null = Wait-Op ($reader.LoadAsync($n)) ([uint32])
  $bytes = New-Object byte[] $n
  $reader.ReadBytes($bytes)
  [System.IO.File]::WriteAllBytes($l.file, $bytes)
  $made++
}
"made $made of $($lines.Count) lines"
