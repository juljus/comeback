<template>
  <Teleport to="body">
    <div v-if="visible" class="bug-modal-overlay" @click.self="$emit('close')">
      <div class="bug-modal">
        <h2 class="bug-modal__title">{{ $t('bug.reportBug') }}</h2>

        <form v-if="!issueUrl" class="bug-modal__form" @submit.prevent="submit">
          <label class="bug-modal__label">
            {{ $t('bug.title') }}
            <input
              v-model="title"
              type="text"
              required
              class="bug-modal__input"
              :placeholder="$t('bug.titlePlaceholder')"
            />
          </label>

          <label class="bug-modal__label">
            {{ $t('bug.description') }}
            <textarea
              v-model="description"
              class="bug-modal__textarea"
              rows="4"
              :placeholder="$t('bug.descriptionPlaceholder')"
            />
          </label>

          <label class="bug-modal__checkbox">
            <input v-model="includeScreenshot" type="checkbox" />
            {{ $t('bug.includeScreenshot') }}
          </label>

          <label class="bug-modal__checkbox">
            <input v-model="includeGameState" type="checkbox" />
            {{ $t('bug.includeGameState') }}
          </label>

          <div class="bug-modal__actions">
            <button
              type="button"
              class="bug-modal__btn bug-modal__btn--cancel"
              @click="$emit('close')"
            >
              {{ $t('ui.cancel') }}
            </button>
            <button
              type="submit"
              class="bug-modal__btn bug-modal__btn--submit"
              :disabled="submitting"
            >
              {{ submitting ? $t('bug.submitting') : $t('bug.submit') }}
            </button>
          </div>
        </form>

        <div v-else class="bug-modal__success">
          <p>{{ $t('bug.success') }}</p>
          <a :href="issueUrl" target="_blank" rel="noopener noreferrer">{{ issueUrl }}</a>
          <button class="bug-modal__btn bug-modal__btn--cancel" @click="close">
            {{ $t('ui.close') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  gameState: unknown
}>()

const emit = defineEmits<{ close: [] }>()

const title = ref('')
const description = ref('')
const includeScreenshot = ref(true)
const includeGameState = ref(true)
const submitting = ref(false)
const issueUrl = ref('')

async function captureScreenshot(): Promise<string | null> {
  try {
    const html2canvas = (await import('html2canvas')).default
    const board = document.querySelector('.game-board') as HTMLElement | null
    if (!board) return null
    const canvas = await html2canvas(board)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

async function submit() {
  submitting.value = true
  try {
    let screenshot: string | undefined
    if (includeScreenshot.value) {
      screenshot = (await captureScreenshot()) ?? undefined
    }

    const payload: Record<string, string | undefined> = {
      title: title.value,
      description: description.value || undefined,
      screenshot,
      gameState: includeGameState.value ? JSON.stringify(props.gameState, null, 2) : undefined,
    }

    const result = await $fetch<{ url: string }>('/api/bugs/report', {
      method: 'POST',
      body: payload,
    })

    issueUrl.value = result.url
  } catch (err) {
    console.error('Bug report failed:', err)
  } finally {
    submitting.value = false
  }
}

function close() {
  title.value = ''
  description.value = ''
  issueUrl.value = ''
  emit('close')
}
</script>

<style scoped>
.bug-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.bug-modal {
  background: #f5f0e6;
  border: 2px solid #8b6914;
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.bug-modal__title {
  margin: 0 0 1rem;
  color: #6b5e50;
  font-size: 1.25rem;
}

.bug-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bug-modal__label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: #6b5e50;
  font-size: 0.875rem;
}

.bug-modal__input,
.bug-modal__textarea {
  padding: 0.5rem;
  border: 1px solid #c4b99a;
  border-radius: 0.25rem;
  background: #fff;
  font-family: inherit;
  font-size: 0.875rem;
}

.bug-modal__input:focus,
.bug-modal__textarea:focus {
  outline: 2px solid #8b6914;
  outline-offset: 1px;
}

.bug-modal__checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b5e50;
  font-size: 0.875rem;
  cursor: pointer;
}

.bug-modal__actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.bug-modal__btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: 1px solid #c4b99a;
  cursor: pointer;
  font-size: 0.875rem;
}

.bug-modal__btn--cancel {
  background: #e8e2d4;
  color: #6b5e50;
}

.bug-modal__btn--submit {
  background: #8b6914;
  color: #fff;
  border-color: #8b6914;
}

.bug-modal__btn--submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bug-modal__success {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  text-align: center;
  color: #6b5e50;
}

.bug-modal__success a {
  color: #8b6914;
  word-break: break-all;
}
</style>
