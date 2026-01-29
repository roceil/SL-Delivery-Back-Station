<script lang="ts" setup>
import { usePrintSettingsStore } from '~/stores/printSettings'

// 禁用 SSR 以避免 hydration 問題（此頁面依賴 localStorage）
definePageMeta({
  ssr: false,
})

const printSettingsStore = usePrintSettingsStore()

useHead({
  title: '列印預覽與調整 - 行李運送系統',
})

// 範例訂單資料
const sampleOrder = {
  id: 'ORD-2024-001',
  category: '散客',
  lineName: '王小明',
  phone: '0912-345-678',
  deliveryDate: '2024-01-15',
  pickupTime: '14:30',
  luggageCount: 2,
  status: '已確認',
  pickupLocation: {
    id: '1',
    name: '台北車站',
    address: '台北市中正區北平西路3號',
    area: '台北',
  },
  deliveryLocation: {
    id: '2',
    name: '桃園機場',
    address: '桃園市大園區航站南路9號',
    area: '桃園',
  },
}

// 處理元素點擊
function handleElementClick(elementId: string) {
  printSettingsStore.selectElement(elementId)
}

// 處理元素移動
function handleElementMove(elementId: string, x: number, y: number) {
  printSettingsStore.updateElement(elementId, { x, y })
}

// 重置為預設模板
function handleReset() {
  // eslint-disable-next-line no-alert
  if (!confirm('確定要重置為預設模板嗎？目前的調整將會遺失。'))
    return

  printSettingsStore.resetToDefault()
}

// 新增元素
const showAddElementDialog = ref(false)
const newElementType = ref<'qrcode' | 'text' | 'divider'>('text')

function addNewElement() {
  if (newElementType.value === 'qrcode') {
    printSettingsStore.addElement({
      type: 'qrcode',
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      field: 'id',
    })
  }
  else if (newElementType.value === 'text') {
    printSettingsStore.addElement({
      type: 'text',
      x: 10,
      y: 10,
      fontSize: 10,
      fontWeight: 'normal',
      field: 'id',
    })
  }
  else if (newElementType.value === 'divider') {
    printSettingsStore.addElement({
      type: 'divider',
      x: 10,
      y: 10,
      width: 30,
    })
  }

  showAddElementDialog.value = false
  nextTick(() => {
    const elements = printSettingsStore.currentTemplate.elements
    const lastElement = elements[elements.length - 1]
    if (lastElement) {
      printSettingsStore.selectElement(lastElement.id)
    }
  })
}

// 刪除選中的元素
function deleteSelectedElement() {
  if (!printSettingsStore.selectedElementId)
    return

  // eslint-disable-next-line no-alert
  if (confirm('確定要刪除此元素嗎？')) {
    printSettingsStore.deleteElement(printSettingsStore.selectedElementId)
  }
}

// 欄位選項
const fieldOptions = [
  { label: '訂單編號', value: 'id' },
  { label: 'LINE 名稱', value: 'lineName' },
  { label: '電話', value: 'phone' },
  { label: '狀態', value: 'status' },
  { label: '類別', value: 'category' },
  { label: '配送日期', value: 'deliveryDate' },
  { label: '收貨時間', value: 'pickupTime' },
  { label: '行李數量', value: 'luggageCount' },
  { label: '起始點名稱', value: 'pickupLocation.name' },
  { label: '起始點地址', value: 'pickupLocation.address' },
  { label: '送達點名稱', value: 'deliveryLocation.name' },
  { label: '送達點地址', value: 'deliveryLocation.address' },
  { label: '列印日期（當前日期）', value: '_printDate' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          列印預覽與調整
        </h1>
        <p class="mt-1 text-sm text-gray-500">
          即時預覽調整列印模板（調整不會儲存，實際修改請編輯程式碼）
        </p>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink
          to="/orders"
          class="
            rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
            font-medium text-gray-700 shadow-sm
            hover:bg-gray-50
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            focus:outline-none
          "
        >
          返回訂單列表
        </NuxtLink>
        <button
          type="button"
          class="
            rounded-md border border-red-300 bg-white px-4 py-2 text-sm
            font-medium text-red-700 shadow-sm
            hover:bg-red-50
            focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            focus:outline-none
          "
          @click="handleReset"
        >
          重置預覽
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col gap-6">
      <!-- 預覽區塊 -->
      <div class="flex-1">
        <!-- Canvas Preview -->
        <div class="rounded-lg bg-white p-6 shadow">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              預覽 ({{ printSettingsStore.currentTemplate.width }}mm × {{ printSettingsStore.currentTemplate.height }}mm)
            </h2>
            <div class="flex gap-2">
              <button
                type="button"
                class="
                  rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm
                  font-medium text-gray-700 shadow-sm
                  hover:bg-gray-50
                "
                @click="showAddElementDialog = true"
              >
                + 新增元素
              </button>
              <button
                v-if="printSettingsStore.selectedElementId"
                type="button"
                class="
                  rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm
                  font-medium text-red-700 shadow-sm
                  hover:bg-red-50
                "
                @click="deleteSelectedElement"
              >
                刪除元素
              </button>
            </div>
          </div>

          <!-- Canvas -->
          <div
            class="flex justify-center overflow-auto rounded-lg bg-gray-50 p-8"
          >
            <PrintCanvas
              :template="printSettingsStore.currentTemplate"
              :sample-data="sampleOrder"
              :scale="2"
              :interactive="true"
              @element-click="handleElementClick"
              @element-move="handleElementMove"
            />
          </div>
        </div>
      </div>

      <!-- 模板資訊與元素屬性 -->
      <div class="flex w-full gap-6">
        <!-- 模板資訊 -->
        <div class="w-1/2 rounded-lg bg-white p-6 shadow">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            模板資訊
          </h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">模板名稱</label>
              <input
                v-model="printSettingsStore.currentTemplate.name"
                type="text"
                class="
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  sm:text-sm
                "
              >
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">寬度 (mm)</label>
                <input
                  v-model.number="printSettingsStore.currentTemplate.width"
                  type="number"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">高度 (mm)</label>
                <input
                  v-model.number="printSettingsStore.currentTemplate.height"
                  type="number"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 元素屬性 -->
        <div
          v-if="printSettingsStore.selectedElement"
          class="w-1/2 rounded-lg bg-white p-6 shadow"
        >
          <h2 class="mb-4 text-lg font-semibold text-gray-900">
            元素屬性
          </h2>
          <div class="space-y-4">
            <!-- Common Properties -->
            <div>
              <label class="block text-sm font-medium text-gray-700">元素類型</label>
              <input
                :value="printSettingsStore.selectedElement.type"
                type="text"
                disabled
                class="
                  mt-1 block w-full rounded-md border-gray-300 bg-gray-50
                  shadow-sm
                  sm:text-sm
                "
              >
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700">X 位置 (mm)</label>
                <input
                  :value="printSettingsStore.selectedElement.x.toFixed(1)"
                  type="number"
                  step="0.1"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                  @input="printSettingsStore.updateElement(
                    printSettingsStore.selectedElement!.id,
                    { x: parseFloat(($event.target as HTMLInputElement).value) },
                  )"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Y 位置 (mm)</label>
                <input
                  :value="printSettingsStore.selectedElement.y.toFixed(1)"
                  type="number"
                  step="0.1"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                  @input="printSettingsStore.updateElement(
                    printSettingsStore.selectedElement!.id,
                    { y: parseFloat(($event.target as HTMLInputElement).value) },
                  )"
                >
              </div>
            </div>

            <!-- QR Code Properties -->
            <template v-if="printSettingsStore.selectedElement.type === 'qrcode'">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700">寬度 (mm)</label>
                  <input
                    v-model.number="printSettingsStore.selectedElement.width"
                    type="number"
                    class="
                      mt-1 block w-full rounded-md border-gray-300 shadow-sm
                      focus:border-blue-500 focus:ring-blue-500
                      sm:text-sm
                    "
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">高度 (mm)</label>
                  <input
                    v-model.number="printSettingsStore.selectedElement.height"
                    type="number"
                    class="
                      mt-1 block w-full rounded-md border-gray-300 shadow-sm
                      focus:border-blue-500 focus:ring-blue-500
                      sm:text-sm
                    "
                  >
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">資料欄位</label>
                <select
                  v-model="printSettingsStore.selectedElement.field"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
                  <option
                    v-for="option in fieldOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </template>

            <!-- Text Properties -->
            <template v-if="printSettingsStore.selectedElement.type === 'text'">
              <div>
                <label class="block text-sm font-medium text-gray-700">字體大小 (pt)</label>
                <input
                  v-model.number="printSettingsStore.selectedElement.fontSize"
                  type="number"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">字體粗細</label>
                <select
                  v-model="printSettingsStore.selectedElement.fontWeight"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
                  <option value="normal">
                    正常
                  </option>
                  <option value="semibold">
                    半粗體
                  </option>
                  <option value="bold">
                    粗體
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">對齊方式</label>
                <select
                  v-model="printSettingsStore.selectedElement.align"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
                  <option value="left">
                    靠左
                  </option>
                  <option value="center">
                    置中
                  </option>
                  <option value="right">
                    靠右
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">文字顏色</label>
                <input
                  v-model="printSettingsStore.selectedElement.color"
                  type="color"
                  class="
                    mt-1 block h-10 w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                  "
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">資料欄位</label>
                <select
                  v-model="printSettingsStore.selectedElement.field"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
                  <option value="">
                    無（僅顯示標籤）
                  </option>
                  <option
                    v-for="option in fieldOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">固定標籤</label>
                <input
                  v-model="printSettingsStore.selectedElement.label"
                  type="text"
                  placeholder="例如：# 或 件行李"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
                <p class="mt-1 text-xs text-gray-500">
                  標籤會顯示在欄位值之前或之後
                </p>
              </div>

              <div v-if="printSettingsStore.selectedElement.label">
                <label class="block text-sm font-medium text-gray-700">標籤位置</label>
                <select
                  v-model="printSettingsStore.selectedElement.labelPosition"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
                  <option value="before">
                    在欄位值之前（例如：#123）
                  </option>
                  <option value="after">
                    在欄位值之後（例如：2件行李）
                  </option>
                </select>
              </div>

              <div>
                <label class="flex items-center gap-2">
                  <input
                    v-model="printSettingsStore.selectedElement.badge"
                    type="checkbox"
                    class="
                      rounded border-gray-300 text-blue-600
                      focus:ring-blue-500
                    "
                  >
                  <span class="text-sm font-medium text-gray-700">顯示為膠囊徽章</span>
                </label>
                <p class="mt-1 text-xs text-gray-500">
                  以黑底白字的圓角膠囊樣式顯示文字
                </p>
              </div>
            </template>

            <!-- Divider Properties -->
            <template v-if="printSettingsStore.selectedElement.type === 'divider'">
              <div>
                <label class="block text-sm font-medium text-gray-700">長度 (mm)</label>
                <input
                  v-model.number="printSettingsStore.selectedElement.width"
                  type="number"
                  class="
                    mt-1 block w-full rounded-md border-gray-300 shadow-sm
                    focus:border-blue-500 focus:ring-blue-500
                    sm:text-sm
                  "
                >
              </div>
            </template>
          </div>
        </div>

        <!-- 無選取元素時顯示 -->
        <div
          v-else
          class="
            flex w-1/2 items-center justify-center rounded-lg bg-white p-6
            shadow
          "
        >
          <p class="text-center font-bold text-gray-500">
            點擊元素以編輯其屬性
          </p>
        </div>
      </div>

      <!-- 使用說明 -->
      <div class="rounded-md bg-blue-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-blue-800">
              使用說明
            </h3>
            <div class="mt-2 text-sm text-blue-700">
              <ul class="list-inside list-disc space-y-1">
                <li>點擊元素可以選取並編輯屬性</li>
                <li>拖曳元素可以調整位置</li>
                <li>在右側面板調整元素的詳細設定</li>
                <li>此頁面僅供即時預覽，所有調整不會儲存</li>
                <li>
                  確定調整後，請修改
                  <code
                    class="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs"
                  >printSettings.ts</code>
                  中的
                  <code
                    class="rounded bg-blue-100 px-1 py-0.5 font-mono text-xs"
                  >defaultTemplate</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Element Dialog -->
    <div
      v-if="showAddElementDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showAddElementDialog = false"
    >
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 class="mb-4 text-lg font-semibold text-gray-900">
          新增元素
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">元素類型</label>
            <select
              v-model="newElementType"
              class="
                mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                sm:text-sm
              "
            >
              <option value="qrcode">
                QR Code
              </option>
              <option value="text">
                文字
              </option>
              <option value="divider">
                分隔線
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="
                rounded-md border border-gray-300 bg-white px-4 py-2 text-sm
                font-medium text-gray-700 shadow-sm
                hover:bg-gray-50
              "
              @click="showAddElementDialog = false"
            >
              取消
            </button>
            <button
              type="button"
              class="
                rounded-md border border-transparent bg-blue-600 px-4 py-2
                text-sm font-medium text-white shadow-sm
                hover:bg-blue-700
              "
              @click="addNewElement"
            >
              新增
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
