# Patch 446I: Distinct Bake Timer sound themes

Patch 446I keeps the Patch 446B-446G sound-theme architecture intact and changes only the synthesized cue profiles. The timer still emits the same cue roles at the same moments, and the shared audio lifecycle still owns mute, pause, reset, close, Stop alarm and cleanup behavior.

## Audio identities

Classic remains the neutral fallback. It uses simple single-note alerts, slightly stronger final seconds and a plain three-tone expiry sequence.

Bell now behaves like a warm kitchen bell. It uses resonant sine layers, longer ringing tails, high-low alternation in the final ten seconds and a three-bell expiry.

Rooster is a playful abstract phrase, not a sample or voice. It uses rising three-note phrases, repeated rising calls in final-20, tighter rising final-ten cues and a longer rising expiry fanfare.

Halloween is deliberately darker and more theatrical. It uses low sawtooth pulses, final-ten descending triplets, sharp high final-three stabs over a low layer and a longer dissonant expiry chord. It does not use continuous sound throughout the timer.

Dark Commander is mechanical and controlled. It uses geometric low square pulses layered with short metallic sawtooth strikes, disciplined two-part overtime alarms and a bounded impact-plus-warning expiry. It avoids speech, breathing, famous phrases and recognizable character imitation.

Robot Chef is fast, digital and playful. It uses square and triangle arpeggios, short bip-bop periodic cues, faster final-ten sequences, distinct final-three beeps and a success-style expiry pattern.

## Boundaries

No theme IDs, database constraints, APIs, Account UI, Admin UI, cue timestamps, timer durations, visual themes, Kitchen progression, external audio files or URLs changed.

The new tests assert that released themes differ in rhythm, note order, waveform layering, final-three behavior and expiry sequence rather than only frequency.
