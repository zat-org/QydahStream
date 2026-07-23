<template>
  <div class="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100">
    <div class="mx-auto max-w-4xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Theme config</h1>
          <p class="mt-1 text-xs text-zinc-400">
            Not Firestore — use
            <strong class="text-zinc-300">Realtime Database</strong>
            → path
            <code class="text-emerald-300/90">theme_configs/{{ activeThemeId || "qydha" }}</code>
            · default = local file · same password as /log
          </p>
        </div>
        <NuxtLink
          to="/log"
          class="text-xs text-emerald-400/90 underline-offset-2 hover:underline"
        >
          Open /log
        </NuxtLink>
      </header>

      <form
        v-if="!unlocked"
        class="mx-auto max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-5"
        @submit.prevent="unlock"
      >
        <label class="block text-sm text-zinc-300" for="config-password">
          Password
        </label>
        <input
          id="config-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          class="mt-2 w-full rounded border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-emerald-600"
        />
        <p v-if="authError" class="mt-2 text-xs text-red-400">{{ authError }}</p>
        <button
          type="submit"
          class="mt-4 w-full rounded bg-emerald-700 px-3 py-2 text-sm font-medium hover:bg-emerald-600"
        >
          Unlock
        </button>
      </form>

      <template v-else>
        <!-- Theme tabs -->
        <div class="mb-3 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
          <button
            v-for="id in themeIds"
            :key="id"
            type="button"
            class="rounded px-3 py-1.5 text-xs font-medium"
            :class="
              activeThemeId === id
                ? 'bg-emerald-700 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            "
            @click="selectTheme(id)"
          >
            {{ id }}
          </button>
          <button
            type="button"
            class="ml-auto rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700"
            @click="lock"
          >
            Lock
          </button>
        </div>

        <!-- Screen tabs -->
        <div class="mb-4 flex flex-wrap gap-2">
          <button
            v-for="screen in screens"
            :key="screen"
            type="button"
            class="rounded px-3 py-1.5 text-xs"
            :class="
              activeScreen === screen
                ? 'bg-zinc-100 text-zinc-900'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            "
            @click="activeScreen = screen"
          >
            {{ screen }}
          </button>
          <span class="self-center text-[10px] text-zinc-500">
            game: baloot · landscape
          </span>
        </div>

        <div
          class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-xs"
        >
          <span class="text-zinc-400">
            source:
            <strong class="text-zinc-200">{{ draftSource ?? "—" }}</strong>
          </span>
          <span
            class="rounded px-2 py-1 text-[10px]"
            :class="
              autoSaveLabel.includes('fail')
                ? 'bg-red-900/50 text-red-300'
                : autoSaveLabel.includes('Saving') ||
                    autoSaveLabel.includes('Pending')
                  ? 'bg-amber-900/40 text-amber-200'
                  : 'bg-zinc-800 text-zinc-400'
            "
          >
            {{ autoSaveLabel }}
          </span>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="busy"
            @click="reloadDraft"
          >
            Reload
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="busy"
            @click="resetToFile"
          >
            Reset to file
          </button>
          <button
            type="button"
            class="rounded bg-amber-800/90 px-3 py-1.5 hover:bg-amber-700"
            :disabled="busy || !draft"
            @click="publishFileToRtdb"
          >
            Publish file → RTDB
          </button>
          <button
            type="button"
            class="rounded bg-emerald-700 px-3 py-1.5 hover:bg-emerald-600"
            :disabled="busy || !draft"
            @click="saveNow"
          >
            Save now
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="!draft"
            @click="copyExport"
          >
            Copy full theme JSON
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="!canCopyActiveScreen"
            @click="copyScreenJson(activeScreen)"
          >
            Copy {{ activeScreen }} JSON
          </button>
          <button
            type="button"
            class="rounded bg-zinc-700 px-3 py-1.5 hover:bg-zinc-600"
            :disabled="!draft"
            @click="downloadExport"
          >
            Download JSON
          </button>
        </div>

        <p v-if="statusMsg" class="mb-3 text-xs text-emerald-400/90">
          {{ statusMsg }}
        </p>
        <p v-if="errorMsg" class="mb-3 text-xs text-red-400">{{ errorMsg }}</p>
        <p v-if="busy" class="mb-3 text-xs text-zinc-500">Working…</p>

        <div
          v-if="activeScreen === 'statics'"
          class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500"
        >
          Screen “statics” is not in local config yet (Qydha has no landscape
          statics). Harvest later, then edit here.
        </div>

        <div
          v-else-if="activeScreen === 'cam' && !camDraft"
          class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500"
        >
          <p class="mb-3">
            No cam config for theme “{{ activeThemeId }}”.
          </p>
          <button
            type="button"
            class="rounded bg-emerald-700 px-3 py-1.5 text-xs text-white hover:bg-emerald-600"
            @click="ensureCamDraft"
          >
            Add cam defaults
          </button>
        </div>

        <form
          v-else-if="activeScreen === 'cam' && camDraft"
          class="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          @submit.prevent
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-zinc-200">Cam player frames</h2>
            <button
              type="button"
              class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
              @click="copyScreenJson('cam')"
            >
              Copy cam JSON
            </button>
          </div>
          <p class="text-[11px] text-zinc-500">
            Used by Cam overlays. Pass
            <code class="text-emerald-300/90">?theme={{ activeThemeId }}</code>
            on Cam URLs. Us and them each have separate frame + image settings.
          </p>

          <section
            v-for="sideKey in camSideKeys"
            :key="sideKey"
            class="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-sm font-semibold text-zinc-200">
                {{ sideKey === "us" ? "Us (top / bottom)" : "Them (left / right)" }}
              </h3>
              <button
                type="button"
                class="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                @click="copyCamSideJson(sideKey)"
              >
                Copy {{ sideKey }} JSON
              </button>
            </div>

            <label class="block text-xs text-zinc-400">
              frameSrc
              <input
                v-model="camDraft[sideKey].frameSrc"
                class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
              />
            </label>

            <div>
              <p class="mb-2 text-[11px] font-medium text-zinc-300">Frame</p>
              <div class="grid gap-3 sm:grid-cols-4">
                <label
                  v-for="field in camFrameFields"
                  :key="`${sideKey}-${field}`"
                  class="block text-xs text-zinc-400"
                >
                  {{ field }}
                  <input
                    :value="numField(camDraft[sideKey], field)"
                    type="number"
                    step="any"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    @input="setNumField(camDraft[sideKey], field, $event)"
                  />
                </label>
              </div>
            </div>

            <div>
              <p class="mb-2 text-[11px] font-medium text-zinc-300">Image</p>
              <div class="grid gap-3 sm:grid-cols-4">
                <label
                  v-for="field in camImageFields"
                  :key="`${sideKey}-${field}`"
                  class="block text-xs text-zinc-400"
                >
                  {{ field }}
                  <input
                    :value="numField(camDraft[sideKey], field)"
                    type="number"
                    step="any"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    @input="setNumField(camDraft[sideKey], field, $event)"
                  />
                </label>
              </div>
            </div>

            <div class="text-center">
              <p class="mb-2 text-[10px] text-zinc-500">{{ sideKey }} preview</p>
              <div
                class="inline-block rounded border border-dashed border-zinc-700 bg-zinc-950/80 p-3"
              >
                <div
                  class="relative overflow-visible"
                  :style="camSidePreviewSlotStyle(sideKey)"
                >
                  <img
                    v-if="camDraft[sideKey].frameSrc"
                    class="pointer-events-none absolute z-10"
                    :src="camDraft[sideKey].frameSrc"
                    :style="camSidePreviewFrameStyle(sideKey)"
                    :alt="`${sideKey} frame`"
                  />
                  <div
                    class="absolute rounded-2xl bg-zinc-700/80"
                    :style="camSidePreviewImageStyle(sideKey)"
                  />
                </div>
              </div>
              <p class="mt-2 text-[10px] text-zinc-600">
                frame {{ camSideNum(sideKey, "frameWidthPx") }}×{{
                  camSideNum(sideKey, "frameHeightPx")
                }}
                · image {{ camSideNum(sideKey, "imageWidthPx") }}×{{
                  camSideNum(sideKey, "imageHeightPx")
                }}
              </p>
            </div>
          </section>
        </form>

        <div
          v-else-if="!activeDraft"
          class="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-8 text-center text-sm text-zinc-500"
        >
          No landscape baloot {{ activeScreen }} config for theme “{{
            activeThemeId
          }}”.
        </div>

        <form
          v-else-if="activeDraft"
          class="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          @submit.prevent
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold capitalize text-zinc-200">
              {{ activeScreen }} config
            </h2>
            <button
              type="button"
              class="rounded bg-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-600"
              @click="copyScreenJson(activeScreen)"
            >
              Copy {{ activeScreen }} JSON
            </button>
          </div>

          <section>
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Video & timing
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="block text-xs text-zinc-400 sm:col-span-2">
                video
                <input
                  v-model="activeDraft.video"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label
                v-for="field in timingFieldsForScreen"
                :key="field"
                class="block text-xs text-zinc-400"
              >
                {{ field }}
                <input
                  :value="numField(activeDraft, field)"
                  type="number"
                  step="any"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  @input="setNumField(activeDraft, field, $event)"
                />
              </label>
            </div>
            <ConfigTimingTimeline
              :screen="activeScreen"
              :config="activeDraft"
            />
          </section>

          <!-- Score / Detail team layouts -->
          <template v-if="activeScreen === 'score' || activeScreen === 'detail'">
            <section
              v-for="side in teamSides"
              :key="side.key"
              class="space-y-3 border-t border-zinc-800 pt-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-zinc-200">
                  {{ side.label }}
                </h3>
                <button
                  type="button"
                  class="rounded bg-zinc-800 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
                  @click="copyTeamJson(side.key)"
                >
                  Copy team JSON
                </button>
              </div>

              <!-- Wrap -->
              <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
                  Wrap
                </p>
                <div class="grid gap-3 sm:grid-cols-4">
                  <label
                    v-for="field in wrapFields"
                    :key="field"
                    class="block text-xs text-zinc-400"
                  >
                    {{ field }}
                    <input
                      v-model.number="(activeDraft as any)[side.key][field]"
                      type="number"
                      step="any"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                </div>
              </div>

              <!-- Name -->
              <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-sky-400/90">
                  Name
                </p>
                <div class="grid gap-3 sm:grid-cols-3">
                  <label
                    v-for="field in nameNumFields"
                    :key="field"
                    class="block text-xs text-zinc-400"
                  >
                    {{ field }}
                    <input
                      v-model.number="(activeDraft as any)[side.key][field]"
                      type="number"
                      step="any"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                  <label class="block text-xs text-zinc-400">
                    nameColor
                    <input
                      v-model="(activeDraft as any)[side.key].nameColor"
                      type="text"
                      placeholder="#ffffff"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                  <label class="block text-xs text-zinc-400 sm:col-span-2">
                    nameFontFamily
                    <select
                      :value="(activeDraft as any)[side.key].nameFontFamily ?? ''"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                      @change="
                        setNameFontFamily((activeDraft as any)[side.key], $event)
                      "
                    >
                      <option value="">Default (Aref Ruqaa)</option>
                      <option
                        v-for="font in themeFontOptions"
                        :key="font.id"
                        :value="font.id"
                        :style="{ fontFamily: `'${font.id}'` }"
                      >
                        {{ font.label }}
                      </option>
                    </select>
                  </label>
                </div>
              </div>

              <!-- Score -->
              <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
                  Score
                </p>
                <div class="grid gap-3 sm:grid-cols-3">
                  <label
                    v-for="field in scoreNumFields"
                    :key="field"
                    class="block text-xs text-zinc-400"
                  >
                    {{ field }}
                    <input
                      v-model.number="(activeDraft as any)[side.key][field]"
                      type="number"
                      step="any"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                  <label class="block text-xs text-zinc-400">
                    scoreColor
                    <input
                      v-model="(activeDraft as any)[side.key].scoreColor"
                      type="text"
                      placeholder="#334155"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                </div>
              </div>

              <!-- Detail list (detail screen only) -->
              <div
                v-if="activeScreen === 'detail'"
                class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3"
              >
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-violet-400/90">
                  Detail list
                </p>
                <div class="grid gap-3 sm:grid-cols-4">
                  <label
                    v-for="field in detailListFields"
                    :key="field"
                    class="block text-xs text-zinc-400"
                  >
                    {{ field }}
                    <input
                      v-model.number="(activeDraft as any)[side.key][field]"
                      type="number"
                      step="any"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                </div>
              </div>

              <!-- Sponsor -->
              <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-pink-400/90">
                  Sponsor
                </p>
                <div class="grid gap-3 sm:grid-cols-3">
                  <label class="block text-xs text-zinc-400 sm:col-span-3">
                    sponsorSrc
                    <input
                      v-model="(activeDraft as any)[side.key].sponsorSrc"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                  <label
                    v-for="field in sponsorNumFieldsForScreen"
                    :key="field"
                    class="block text-xs text-zinc-400"
                  >
                    {{ field }}
                    <input
                      v-model.number="(activeDraft as any)[side.key][field]"
                      type="number"
                      step="any"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                </div>
              </div>
            </section>
          </template>

          <!-- Winner layout -->
          <template v-else-if="activeScreen === 'winner' && winnerDraft">
            <section class="space-y-3 border-t border-zinc-800 pt-4">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-sky-400/90">
                Name
              </h3>
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="block text-xs text-zinc-400">
                  nameTopPx
                  <input
                    v-model.number="winnerDraft.nameTopPx"
                    type="number"
                    step="any"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                </label>
                <label class="block text-xs text-zinc-400">
                  nameLeftPx (empty = centered)
                  <input
                    :value="numField(winnerDraft, 'nameLeftPx')"
                    type="number"
                    step="any"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    @input="setOptionalNumField(winnerDraft, 'nameLeftPx', $event)"
                  />
                </label>
                <label class="block text-xs text-zinc-400">
                  nameFontSizePx
                  <input
                    v-model.number="winnerDraft.nameFontSizePx"
                    type="number"
                    step="any"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                </label>
                <label class="block text-xs text-zinc-400">
                  nameHeightPx
                  <input
                    :value="numField(winnerDraft, 'nameHeightPx')"
                    type="number"
                    step="any"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    @input="setOptionalNumField(winnerDraft, 'nameHeightPx', $event)"
                  />
                </label>
                <label class="block text-xs text-zinc-400 sm:col-span-2">
                  nameColor (optional — solid; empty keeps gold gradient)
                  <input
                    v-model="winnerDraft.nameColor"
                    type="text"
                    placeholder="#f6e27a"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                </label>
                <label class="block text-xs text-zinc-400 sm:col-span-2">
                  nameFontFamily
                  <select
                    :value="winnerDraft.nameFontFamily ?? ''"
                    class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    @change="setNameFontFamily(winnerDraft, $event)"
                  >
                    <option value="">Default (Aref Ruqaa)</option>
                    <option
                      v-for="font in themeFontOptions"
                      :key="font.id"
                      :value="font.id"
                      :style="{ fontFamily: `'${font.id}'` }"
                    >
                      {{ font.label }}
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <section class="space-y-3 border-t border-zinc-800 pt-4">
              <h3 class="text-xs font-semibold uppercase tracking-wide text-pink-400/90">
                Frames
              </h3>
              <label class="block text-xs text-zinc-400">
                frameUsSrc
                <input
                  v-model="winnerDraft.frameUsSrc"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
              <label class="mt-3 block text-xs text-zinc-400">
                frameThemSrc
                <input
                  v-model="winnerDraft.frameThemSrc"
                  class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                />
              </label>
            </section>

            <section
              v-for="slot in winnerSlots"
              :key="slot.key"
              class="space-y-3 border-t border-zinc-800 pt-4"
            >
              <h3 class="text-sm font-semibold text-zinc-200">
                {{ slot.label }}
              </h3>
              <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3">
                <div class="grid gap-3 sm:grid-cols-3">
                  <label
                    v-for="field in winnerSlotFields"
                    :key="field"
                    class="block text-xs text-zinc-400"
                  >
                    {{ field }}
                    <input
                      v-model.number="winnerDraft[slot.key][field]"
                      type="number"
                      step="any"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                  <label class="block text-xs text-zinc-400 sm:col-span-3">
                    fallbackSrc
                    <input
                      v-model="winnerDraft[slot.key].fallbackSrc"
                      class="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                    />
                  </label>
                </div>
              </div>
            </section>
          </template>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  LandscapeDetailConfig,
  LandscapeScoreConfig,
  LandscapeWinnerConfig,
  LandscapeWinnerPlayerSlot,
  ScreenId,
  ThemeConfig,
} from "~/config/themes/types";
import { THEME_FONT_OPTIONS } from "~/config/themes/fonts";
import {
  CAM_SIDE_DEFAULTS,
  defaultCamConfig,
  normalizeCamConfig,
} from "~/utils/cam-theme";
import {
  exportThemeConfigJson,
  getFileThemeConfig,
  listConfigurableThemeIds,
  resolveThemeConfig,
  saveThemeConfigToRtdb,
  seedThemeConfigFromFileIfMissing,
  type ThemeConfigSource,
} from "~/utils/theme-config-rtdb";
import { isFirebaseConfigured } from "~/utils/firebase.client";

const UNLOCK_KEY = "qydah:log-unlocked";
const themeFontOptions = THEME_FONT_OPTIONS;

const config = useRuntimeConfig().public;
const expectedPassword = computed(() => String(config.logPassword ?? ""));

const password = ref("");
const authError = ref("");
const unlocked = ref(false);

const themeIds = listConfigurableThemeIds();
const activeThemeId = ref(themeIds[0] ?? "qydha");
const screens: ScreenId[] = ["score", "detail", "statics", "winner", "cam"];
const activeScreen = ref<ScreenId>("score");

const draft = ref<ThemeConfig | null>(null);
const draftSource = ref<ThemeConfigSource | null>(null);
const busy = ref(false);
const statusMsg = ref("");
const errorMsg = ref("");
const suppressAutosave = ref(true);
const autoSaveLabel = ref("Auto-save on");

const AUTOSAVE_MS = 700;
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

const scoreTimingFields = [
  "videoWidth",
  "videoHeight",
  "introStartSec",
  "introEndSec",
  "mountDelaySec",
  "mountFadeSec",
  "scoreTweenSec",
  "unmountFadeSec",
  "outroPlaybackRate",
] as const;

const detailTimingFields = [
  "videoWidth",
  "videoHeight",
  "introStartSec",
  "introEndSec",
  "mountDelaySec",
  "mountFadeSec",
  "unmountFadeSec",
  "outroPlaybackRate",
  "mainHoldMs",
] as const;

const winnerTimingFields = [
  "videoWidth",
  "videoHeight",
  "introStartSec",
  "introEndSec",
  "mountDelaySec",
  "mountFadeSec",
  "unmountFadeSec",
  "outroPlaybackRate",
  "mainHoldMs",
  "unmountCompFadeSec",
] as const;

const wrapFields = [
  "wrapLeftPx",
  "wrapTopPx",
  "wrapWidthPx",
  "wrapHeightPx",
] as const;

const nameNumFields = [
  "nameLeftPx",
  "nameTopPx",
  "nameWidthPx",
  "nameFontSizePx",
] as const;

const scoreNumFields = [
  "scoreLeftPx",
  "scoreRightPx",
  "scoreTopPx",
  "scoreFontSizePx",
] as const;

const detailListFields = [
  "detailLeftPx",
  "detailRightPx",
  "detailTopPx",
  "detailWidthPx",
] as const;

const scoreSponsorFields = [
  "sponsorLeftPx",
  "sponsorTopPx",
  "sponsorWidthPx",
  "sponsorHeightPx",
] as const;

const detailSponsorFields = [
  "sponsorLeftPx",
  "sponsorRightPx",
  "sponsorTopPx",
  "sponsorWidthPx",
  "sponsorHeightPx",
] as const;

const winnerSlotFields: (keyof LandscapeWinnerPlayerSlot)[] = [
  "leftPx",
  "topPx",
  "widthPx",
  "heightPx",
  "rotateDeg",
  "imgHeightPx",
];

const teamSides = [
  { key: "team1" as const, label: "Team 1 (us)" },
  { key: "team2" as const, label: "Team 2 (them)" },
];

const winnerSlots = [
  { key: "player1" as const, label: "Player 1" },
  { key: "player2" as const, label: "Player 2" },
];

const scoreDraft = computed(
  () => draft.value?.landscape?.baloot?.score ?? null,
);
const detailDraft = computed(
  () => draft.value?.landscape?.baloot?.detail ?? null,
);
const winnerDraft = computed(
  () => draft.value?.landscape?.baloot?.winner ?? null,
);
const camDraft = computed(
  () => draft.value?.landscape?.baloot?.cam ?? null,
);

const camSideKeys = ["us", "them"] as const;
type CamSideKey = (typeof camSideKeys)[number];

const camFrameFields = [
  "frameWidthPx",
  "frameHeightPx",
  "frameLeftPx",
  "frameTopPx",
] as const;

const camImageFields = [
  "imageWidthPx",
  "imageHeightPx",
  "imageLeftPx",
  "imageTopPx",
] as const;

function camSideNum(
  sideKey: CamSideKey,
  key: keyof typeof CAM_SIDE_DEFAULTS,
): number {
  const v = camDraft.value?.[sideKey]?.[key];
  return typeof v === "number" && !Number.isNaN(v)
    ? v
    : CAM_SIDE_DEFAULTS[key];
}

function camSidePreviewSlotStyle(sideKey: CamSideKey) {
  return {
    width: `${Math.max(
      camSideNum(sideKey, "frameLeftPx") +
        camSideNum(sideKey, "frameWidthPx"),
      camSideNum(sideKey, "imageLeftPx") +
        camSideNum(sideKey, "imageWidthPx"),
      1,
    )}px`,
    height: `${Math.max(
      camSideNum(sideKey, "frameTopPx") +
        camSideNum(sideKey, "frameHeightPx"),
      camSideNum(sideKey, "imageTopPx") +
        camSideNum(sideKey, "imageHeightPx"),
      1,
    )}px`,
  };
}

function camSidePreviewFrameStyle(sideKey: CamSideKey) {
  return {
    width: `${camSideNum(sideKey, "frameWidthPx")}px`,
    height: `${camSideNum(sideKey, "frameHeightPx")}px`,
    left: `${camSideNum(sideKey, "frameLeftPx")}px`,
    top: `${camSideNum(sideKey, "frameTopPx")}px`,
  };
}

function camSidePreviewImageStyle(sideKey: CamSideKey) {
  return {
    width: `${camSideNum(sideKey, "imageWidthPx")}px`,
    height: `${camSideNum(sideKey, "imageHeightPx")}px`,
    left: `${camSideNum(sideKey, "imageLeftPx")}px`,
    top: `${camSideNum(sideKey, "imageTopPx")}px`,
  };
}

function normalizeDraftCam() {
  if (!draft.value?.landscape?.baloot) return;
  const baloot = draft.value.landscape.baloot;
  if (!baloot.cam) return;
  const normalized = normalizeCamConfig(baloot.cam, activeThemeId.value);
  if (normalized) baloot.cam = normalized;
}

async function copyCamSideJson(sideKey: CamSideKey) {
  await copyJson(
    `${activeThemeId.value}/cam/${sideKey}`,
    camDraft.value?.[sideKey] ?? null,
  );
}

const activeDraft = computed<
  LandscapeScoreConfig | LandscapeDetailConfig | LandscapeWinnerConfig | null
>(() => {
  if (activeScreen.value === "score") return scoreDraft.value;
  if (activeScreen.value === "detail") return detailDraft.value;
  if (activeScreen.value === "winner") return winnerDraft.value;
  return null;
});

const sponsorNumFieldsForScreen = computed(() => {
  if (activeScreen.value === "detail") return [...detailSponsorFields];
  return [...scoreSponsorFields];
});

const canCopyActiveScreen = computed(() => {
  if (!draft.value) return false;
  if (activeScreen.value === "statics") return false;
  return screenPayload(activeScreen.value) != null;
});

function ensureCamDraft() {
  if (!draft.value) return;
  const landscape = draft.value.landscape ?? (draft.value.landscape = {});
  const baloot = landscape.baloot ?? (landscape.baloot = {});
  if (baloot.cam) {
    normalizeDraftCam();
    return;
  }
  baloot.cam = defaultCamConfig(activeThemeId.value || "zat");
}

const timingFieldsForScreen = computed(() => {
  if (activeScreen.value === "score") return [...scoreTimingFields];
  if (activeScreen.value === "detail") return [...detailTimingFields];
  if (activeScreen.value === "winner") return [...winnerTimingFields];
  return [];
});

function screenPayload(screen: ScreenId): unknown {
  const baloot = draft.value?.landscape?.baloot;
  if (!baloot) return null;
  if (screen === "score") return baloot.score ?? null;
  if (screen === "detail") return baloot.detail ?? null;
  if (screen === "winner") return baloot.winner ?? null;
  if (screen === "cam") return baloot.cam ?? null;
  return null;
}

async function copyJson(label: string, data: unknown) {
  if (data == null) {
    errorMsg.value = `Nothing to copy for ${label}`;
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    statusMsg.value = `Copied ${label} JSON`;
    errorMsg.value = "";
  } catch {
    errorMsg.value = "Clipboard failed";
  }
}

async function copyScreenJson(screen: ScreenId) {
  await copyJson(`${activeThemeId.value}/${screen}`, screenPayload(screen));
}

async function copyTeamJson(side: "team1" | "team2") {
  const draftScreen = activeDraft.value as
    | LandscapeScoreConfig
    | LandscapeDetailConfig
    | null;
  const team = draftScreen?.[side] ?? null;
  await copyJson(
    `${activeThemeId.value}/${activeScreen.value}/${side}`,
    team,
  );
}
function numField(obj: object | null, key: string): number | "" {
  if (!obj) return "";
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "number" ? v : "";
}

function setNumField(obj: object | null, key: string, event: Event) {
  if (!obj) return;
  const raw = (event.target as HTMLInputElement).value;
  (obj as Record<string, unknown>)[key] = Number(raw);
}

function setOptionalNumField(obj: object | null, key: string, event: Event) {
  if (!obj) return;
  const raw = (event.target as HTMLSelectElement | HTMLInputElement).value;
  const target = obj as Record<string, unknown>;
  if (raw === "" || raw == null) {
    delete target[key];
  } else {
    target[key] = Number(raw);
  }
}

function setNameFontFamily(obj: object | null, event: Event) {
  if (!obj) return;
  const raw = (event.target as HTMLSelectElement).value;
  const target = obj as Record<string, unknown>;
  if (!raw) {
    delete target.nameFontFamily;
  } else {
    target.nameFontFamily = raw;
  }
}

function clearAutosaveTimer() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
}

function scheduleAutosave() {
  if (suppressAutosave.value || !unlocked.value || !draft.value) return;
  clearAutosaveTimer();
  autoSaveLabel.value = "Pending save…";
  autosaveTimer = setTimeout(() => {
    void runAutosave();
  }, AUTOSAVE_MS);
}

async function runAutosave() {
  if (!draft.value || suppressAutosave.value) return;
  autoSaveLabel.value = "Saving…";
  errorMsg.value = "";
  try {
    await saveThemeConfigToRtdb(draft.value);
    draftSource.value = "rtdb";
    autoSaveLabel.value = `Saved ${new Date().toLocaleTimeString()}`;
    statusMsg.value = `Auto-saved theme_configs/${draft.value.id} — open boards update live`;
  } catch (e) {
    autoSaveLabel.value = "Save failed";
    errorMsg.value = e instanceof Error ? e.message : "Auto-save failed";
  }
}

watch(
  draft,
  () => {
    scheduleAutosave();
  },
  { deep: true },
);

onMounted(() => {
  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(UNLOCK_KEY) === "1"
  ) {
    unlocked.value = true;
    void reloadDraft();
  }
});

onBeforeUnmount(() => {
  clearAutosaveTimer();
});

function unlock() {
  authError.value = "";
  if (!expectedPassword.value) {
    authError.value = "loginPassword is not configured in .env";
    return;
  }
  if (password.value !== expectedPassword.value) {
    authError.value = "Wrong password";
    return;
  }
  unlocked.value = true;
  sessionStorage.setItem(UNLOCK_KEY, "1");
  void reloadDraft();
}

function lock() {
  unlocked.value = false;
  password.value = "";
  sessionStorage.removeItem(UNLOCK_KEY);
  clearAutosaveTimer();
  suppressAutosave.value = true;
}

function selectTheme(id: string) {
  activeThemeId.value = id;
  void reloadDraft();
}

async function reloadDraft() {
  busy.value = true;
  suppressAutosave.value = true;
  clearAutosaveTimer();
  errorMsg.value = "";
  statusMsg.value = "";
  try {
    if (!isFirebaseConfigured()) {
      statusMsg.value = "Firebase not configured — showing local file only";
    }
    const result = await resolveThemeConfig(activeThemeId.value);
    draft.value = result.config;
    normalizeDraftCam();
    draftSource.value = result.source;
    autoSaveLabel.value = "Auto-save on";
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : "Reload failed";
  } finally {
    busy.value = false;
    await nextTick();
    suppressAutosave.value = false;
  }
}

async function resetToFile() {
  busy.value = true;
  suppressAutosave.value = true;
  clearAutosaveTimer();
  errorMsg.value = "";
  statusMsg.value = "";
  try {
    const file = getFileThemeConfig(activeThemeId.value);
    if (!file) {
      errorMsg.value = "No local file for this theme";
      return;
    }
    draft.value = file;
    normalizeDraftCam();
    draftSource.value = "file";
    statusMsg.value = "Draft reset to local file — will auto-save shortly";
  } finally {
    busy.value = false;
    await nextTick();
    suppressAutosave.value = false;
    scheduleAutosave();
  }
}

async function saveNow() {
  clearAutosaveTimer();
  await runAutosave();
}

async function publishFileToRtdb() {
  busy.value = true;
  suppressAutosave.value = true;
  clearAutosaveTimer();
  errorMsg.value = "";
  statusMsg.value = "";
  try {
    const file = getFileThemeConfig(activeThemeId.value);
    if (!file) {
      errorMsg.value = "No local file for this theme";
      return;
    }
    const result = await seedThemeConfigFromFileIfMissing(activeThemeId.value);
    if (result === "exists") {
      await saveThemeConfigToRtdb(file);
      statusMsg.value = `Overwrote theme_configs/${file.id} from local file`;
    } else if (result === "seeded") {
      statusMsg.value = `Created theme_configs/${file.id} from local file`;
    } else if (result === "skipped") {
      errorMsg.value = "Firebase not configured";
      return;
    } else {
      errorMsg.value = "No local file to publish";
      return;
    }
    await reloadDraft();
    draftSource.value = "rtdb";
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : "Publish failed";
  } finally {
    busy.value = false;
    await nextTick();
    suppressAutosave.value = false;
  }
}

async function copyExport() {
  if (!draft.value) return;
  try {
    await navigator.clipboard.writeText(exportThemeConfigJson(draft.value));
    statusMsg.value = "JSON copied — paste into config/themes/{id}.ts if needed";
  } catch {
    errorMsg.value = "Clipboard failed";
  }
}

function downloadExport() {
  if (!draft.value) return;
  const blob = new Blob([exportThemeConfigJson(draft.value)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `theme-${draft.value.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
  statusMsg.value = "Downloaded JSON export";
}
</script>
