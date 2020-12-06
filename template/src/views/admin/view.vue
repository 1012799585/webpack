<template>
  <section style="padding: 10px">
    <!--查询-->
    <el-form :inline="true" :model="filters" @submit.native.prevent>
      <el-form-item>
        <el-input
          v-model="filters.label"
          placeholder="视图名或地址"
          clearable
          @keyup.enter.native="onGetList"
        >
          <template #prefix>
            <i class="el-input__icon el-icon-search" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onGetList">查询</el-button>
      </el-form-item>
      <el-form-item v-if="checkPermission(['api:admin:view:add'])">
        <el-button type="primary" @click="onAdd">新增</el-button>
      </el-form-item>
      <el-form-item v-if="checkPermission(['api:admin:view:sync'])">
        <my-confirm-button
          :icon="'el-icon-refresh'"
          :placement="'bottom-end'"
          :loading="syncLoading"
          style="margin: 0px"
          @click="onSync"
        >
          <template #content>
            <p>确定要同步视图吗？</p>
          </template>
          同步视图
        </my-confirm-button>
      </el-form-item>
      <el-form-item v-if="checkPermission(['api:admin:view:batchsoftdelete'])">
        <my-confirm-button
          :disabled="sels.length === 0"
          :type="'delete'"
          :placement="'bottom-end'"
          :loading="deleteLoading"
          style="margin-left: 0px"
          @click="onBatchDelete"
        >
          <template #content>
            <p>确定要批量删除吗？</p>
          </template>
          批量删除
        </my-confirm-button>
      </el-form-item>
      <el-form-item>
        <my-confirm-button
          :disabled="sels.length === 0"
          :type="'delete'"
          :placement="'bottom-end'"
          :loading="deleteLoading"
          style="margin-left: 0px"
          @click="onGenerate"
        >
          <template #content>
            <p>确定要生成视图吗？</p>
          </template>
          生成视图
        </my-confirm-button>
      </el-form-item>
    </el-form>

    <!--列表-->
    <el-table
      ref="multipleTable"
      v-loading="listLoading"
      row-key="id"
      :data="viewTree"
      :default-expand-all="false"
      :expand-row-keys="expandRowKeys"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      highlight-current-row
      style="width: 100%"
      @select-all="onSelectAll"
      @select="onSelect"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column type="index" width="50" label="#" />
      <el-table-column prop="label" label="视图名" width="180" />
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="path" label="视图地址" width />
      <el-table-column prop="description" label="视图描述" width />
      <el-table-column prop="enabled" label="状态" width="100">
        <template v-slot="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'" disable-transitions>
            {{ row.enabled ? "正常" : "禁用" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        v-if="
          checkPermission([
            'api:admin:view:update',
            'api:admin:view:softdelete',
          ])
        "
        label="操作"
        width="180"
      >
        <template v-slot="{ $index, row }">
          <el-button
            v-if="checkPermission(['api:admin:view:update'])"
            @click="onEdit($index, row)"
            >编辑</el-button
          >
          <my-confirm-button
            v-if="checkPermission(['api:admin:view:softdelete'])"
            type="delete"
            :loading="row._loading"
            @click="onDelete($index, row)"
          />
        </template>
      </el-table-column>
    </el-table>

    <!--新增窗口-->
    <el-dialog
      v-if="checkPermission(['api:admin:view:add'])"
      title="新增"
      :visible.sync="addFormVisible"
      :close-on-click-modal="false"
      @close="onCloseAddForm"
    >
      <el-form
        ref="addForm"
        :model="addForm"
        label-width="80px"
        :rules="addFormRules"
      >
        <el-form-item prop="parentIds" label="所属模块">
          <el-cascader
            :key="addFormKey"
            v-model="addForm.parentIds"
            placeholder="请选择，支持搜索功能"
            :options="modules"
            :props="{ checkStrictly: true, value: 'id' }"
            filterable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="视图名" prop="label">
          <el-input v-model="addForm.label" auto-complete="off" />
        </el-form-item>
        <el-form-item label="视图地址" prop="path">
          <el-input v-model="addForm.path" auto-complete="off" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-switch v-model="addForm.enabled" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="addForm.description"
            type="textarea"
            rows="2"
            auto-complete="off"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click.native="addFormVisible = false">取消</el-button>
          <my-confirm-button
            type="submit"
            :validate="addFormValidate"
            :loading="addLoading"
            @click="onAddSubmit"
          />
        </div>
      </template>
    </el-dialog>

    <!--编辑窗口-->
    <el-dialog
      v-if="checkPermission(['api:admin:view:update'])"
      title="编辑"
      :visible.sync="editFormVisible"
      :close-on-click-modal="false"
      @close="onCloseEditForm"
    >
      <el-form
        ref="editForm"
        :model="editForm"
        :rules="editFormRules"
        label-width="80px"
      >
        <el-form-item prop="parentIds" label="所属模块">
          <el-cascader
            :key="editFormKey"
            v-model="editForm.parentIds"
            placeholder="请选择，支持搜索功能"
            :options="modules"
            :props="{ checkStrictly: true, value: 'id' }"
            filterable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="视图名" prop="label">
          <el-input v-model="editForm.label" auto-complete="off" />
        </el-form-item>
        <el-form-item label="视图地址" prop="path">
          <el-input v-model="editForm.path" auto-complete="off" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            rows="2"
            auto-complete="off"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click.native="editFormVisible = false">取消</el-button>
          <my-confirm-button
            type="submit"
            :validate="editFormValidate"
            :loading="editLoading"
            @click="onEditSubmit"
          />
        </div>
      </template>
    </el-dialog>

    <!--生成窗口-->
    <el-dialog
      title="生成"
      :visible.sync="shengchengFormVisible"
      :close-on-click-modal="false"
    >
      <parser :key="key2" :form-conf="formConf" />
    </el-dialog>
  </section>
</template>

<script>
import { formatTime, treeToList, listToTree, getTreeParents } from "@/utils";
import {
  removeView,
  editView,
  addView,
  syncView,
  getViewList,
  batchRemoveView,
  getView,
} from "@/api/admin/view";
import MyConfirmButton from "@/components/my-confirm-button";
import ejs from "ejs";
import { saveAs } from "file-saver";
import Parser from "form-gen-parser";
import {
  makeUpHtml,
  vueTemplate,
  vueScript,
  cssStyle,
} from "@/components/generator/html";
import {
  exportDefault,
  beautifierConf,
  isNumberStr,
  titleCase,
  deepClone,
} from "@/utils/index";
import { makeUpJs } from "@/components/generator/js";
import { makeUpCss } from "@/components/generator/css";
import loadBeautifier from "@/utils/loadBeautifier";
export default {
  name: "V",
  components: {
    MyConfirmButton,
    Parser,
  },
  data() {
    return {
      key2: +new Date(),
      formConf: {
        fields: [
          {
            __config__: {
              label: "单行文本",
              labelWidth: null,
              showLabel: true,
              changeTag: true,
              tag: "el-input",
              tagIcon: "input",
              required: true,
              layout: "colFormItem",
              span: 24,
              document: "https://element.eleme.cn/#/zh-CN/component/input",
              regList: [
                {
                  pattern: "/^1(3|4|5|7|8|9)\\d{9}$/",
                  message: "手机号格式错误",
                },
              ],
            },
            __slot__: {
              prepend: "",
              append: "",
            },
            __vModel__: "mobile",
            placeholder: "请输入手机号",
            style: {
              width: "100%",
            },
            clearable: true,
            "prefix-icon": "el-icon-mobile",
            "suffix-icon": "",
            maxlength: 11,
            "show-word-limit": true,
            readonly: false,
            disabled: false,
          },
          {
            __config__: {
              label: "日期范围",
              tag: "el-date-picker",
              tagIcon: "date-range",
              defaultValue: null,
              span: 24,
              showLabel: true,
              labelWidth: null,
              required: true,
              layout: "colFormItem",
              regList: [],
              changeTag: true,
              document:
                "https://element.eleme.cn/#/zh-CN/component/date-picker",
              formId: 101,
              renderKey: 1585980082729,
            },
            style: {
              width: "100%",
            },
            type: "daterange",
            "range-separator": "至",
            "start-placeholder": "开始日期",
            "end-placeholder": "结束日期",
            disabled: false,
            clearable: true,
            format: "yyyy-MM-dd",
            "value-format": "yyyy-MM-dd",
            readonly: false,
            __vModel__: "field101",
          },
          {
            __config__: {
              layout: "rowFormItem",
              tagIcon: "row",
              label: "行容器",
              layoutTree: true,
              children: [
                {
                  __config__: {
                    label: "评分",
                    tag: "el-rate",
                    tagIcon: "rate",
                    defaultValue: 0,
                    span: 24,
                    showLabel: true,
                    labelWidth: null,
                    layout: "colFormItem",
                    required: true,
                    regList: [],
                    changeTag: true,
                    document: "https://element.eleme.cn/#/zh-CN/component/rate",
                    formId: 102,
                    renderKey: 1586839671259,
                  },
                  style: {},
                  max: 5,
                  "allow-half": false,
                  "show-text": false,
                  "show-score": false,
                  disabled: false,
                  __vModel__: "field102",
                },
              ],
              document: "https://element.eleme.cn/#/zh-CN/component/layout",
              formId: 101,
              span: 24,
              renderKey: 1586839668999,
              componentName: "row101",
              gutter: 15,
            },
            type: "default",
            justify: "start",
            align: "top",
          },
          {
            __config__: {
              label: "按钮",
              showLabel: true,
              changeTag: true,
              labelWidth: null,
              tag: "el-button",
              tagIcon: "button",
              span: 24,
              layout: "colFormItem",
              document: "https://element.eleme.cn/#/zh-CN/component/button",
              renderKey: 1594288459289,
            },
            __slot__: {
              default: "测试按钮1",
            },
            type: "primary",
            icon: "el-icon-search",
            round: false,
            size: "medium",
            plain: false,
            circle: false,
            disabled: false,
            on: {
              click: "clickTestButton1",
            },
          },
        ],
        __methods__: {
          clickTestButton1() {
            console.log(
              `%c【测试按钮1】点击事件里可以访问当前表单：
                1) formModel='formData', 所以this.formData可以拿到当前表单的model
                2) formRef='elForm', 所以this.$refs.elForm可以拿到当前表单的ref(vue组件)
              `,
              "color:#409EFF;font-size: 15px"
            );
            console.log("表单的Model：", this.formData);
            console.log("表单的ref：", this.$refs.elForm);
          },
        },
        formRef: "elForm",
        formModel: "formData",
        size: "small",
        labelPosition: "right",
        labelWidth: 100,
        formRules: "rules",
        gutter: 15,
        disabled: false,
        span: 24,
        formBtns: true,
        unFocusedComponentBorder: false,
      },
      filters: {
        label: "",
      },
      viewTree: [],
      expandRowKeys: [],
      listLoading: false,
      sels: [], // 列表选中列

      addDialogFormVisible: false,
      editFormVisible: false, // 编辑界面是否显示
      editLoading: false,
      shengchengFormVisible: false,
      editFormRules: {
        parentIds: [
          { required: true, message: "请选择所属模块", trigger: "change" },
        ],
        path: [{ required: true, message: "请输入视图地址", trigger: "blur" }],
        label: [{ required: true, message: "请输入视图名", trigger: "blur" }],
      },
      // 编辑界面数据
      editForm: {
        id: 0,
        parentIds: [],
        path: "",
        label: "",
        enabled: false,
        description: "",
      },
      editFormKey: 1,

      addFormVisible: false, // 新增界面是否显示
      addLoading: false,
      addFormRules: {
        parentIds: [
          { required: true, message: "请选择所属模块", trigger: "change" },
        ],
        path: [{ required: true, message: "请输入视图地址", trigger: "blur" }],
        label: [{ required: true, message: "请输入视图名", trigger: "blur" }],
      },
      // 新增界面数据
      addForm: {
        parentIds: [],
        path: "",
        label: "",
        enabled: true,
        description: "",
      },
      addFormKey: 1,
      modules: [],
      syncLoading: false,
      deleteLoading: false,
    };
  },
  mounted() {
    this.onGetList();
    loadBeautifier((btf) => {
      beautifier = btf;
    });
  },
  methods: {
    formatCreatedTime: function (row, column, time) {
      return formatTime(time, "yyyy-MM-dd hh:mm");
    },
    // 获取列表
    async onGetList() {
      const para = {
        key: this.filters.label,
      };
      this.listLoading = true;
      const res = await getViewList(para);
      this.listLoading = false;

      if (!res?.success) {
        return;
      }

      const list = _.cloneDeep(res.data);

      const keys = list.filter((l) => l.parentId === 0).map((l) => l.id + "");
      this.expandRowKeys = keys;

      this.modules = listToTree(_.cloneDeep(list), {
        id: 0,
        parentId: 0,
        label: "根节点",
      });

      list.forEach((l) => {
        l._loading = false;
      });

      const tree = listToTree(list);
      this.sels = [];
      this.viewTree = tree;
    },
    // 显示编辑界面
    async onEdit(index, row) {
      const loading = this.$loading();
      const res = await getView({ id: row.id });
      loading.close();
      if (res && res.success) {
        const parents = getTreeParents(this.viewTree, row.id);
        const parentIds = parents.map((p) => p.id);
        parentIds.unshift(0);

        const data = res.data;
        data.parentIds = parentIds;
        this.editForm = data;
        this.editFormVisible = true;
        ++this.editFormKey;
      }
    },
    onCloseEditForm() {
      this.$refs.editForm.resetFields();
      ++this.editFormKey;
    },

    // 显示新增界面
    onAdd() {
      this.addFormVisible = true;
    },
    onCloseAddForm() {
      this.$refs.addForm.resetFields();
      ++this.addFormKey;
    },
    // 编辑
    editFormValidate: function () {
      let isValid = false;
      this.$refs.editForm.validate((valid) => {
        isValid = valid;
      });
      return isValid;
    },
    async onEditSubmit() {
      this.editLoading = true;
      const para = _.cloneDeep(this.editForm);
      para.parentId = para.parentIds.pop();
      if (para.id === para.parentId) {
        this.$message({
          message: "所属模块不能是自己！",
          type: "error",
        });
        this.editLoading = false;
        return;
      }

      const res = await editView(para);
      this.editLoading = false;

      if (!res?.success) {
        return;
      }

      this.$message({
        message: this.$t("admin.updateOk"),
        type: "success",
      });
      this.$refs["editForm"].resetFields();
      this.editFormVisible = false;
      this.onGetList();
    },
    // 新增
    addFormValidate: function () {
      let isValid = false;
      this.$refs.addForm.validate((valid) => {
        isValid = valid;
      });
      return isValid;
    },
    async onAddSubmit() {
      this.addLoading = true;
      const para = _.cloneDeep(this.addForm);
      para.parentId = para.parentIds.pop();

      const res = await addView(para);
      this.addLoading = false;

      if (!res?.success) {
        return;
      }
      this.$message({
        message: this.$t("admin.addOk"),
        type: "success",
      });
      this.$refs["addForm"].resetFields();
      this.addFormVisible = false;
      this.onGetList();
    },
    // 删除
    async onDelete(index, row) {
      row._loading = true;
      const para = { id: row.id };
      const res = await removeView(para);

      row._loading = false;

      if (!res?.success) {
        return;
      }
      this.$message({
        message: this.$t("admin.deleteOk"),
        type: "success",
      });
      this.onGetList();
    },
    // 批量删除
    async onBatchDelete() {
      const para = { ids: [] };
      para.ids = this.sels.map((s) => {
        return s.id;
      });

      this.deleteLoading = true;
      const res = await batchRemoveView(para.ids);
      this.deleteLoading = false;

      if (!res?.success) {
        return;
      }

      this.$message({
        message: this.$t("admin.batchDeleteOk"),
        type: "success",
      });

      this.onGetList();
    },
    // 同步view
    async onSync() {
      const unFinish = true;
      if (unFinish) {
        this.$message({
          message: "开发中",
          type: "info",
        });
        return;
      }

      const views = [];
      this.syncLoading = true;
      const syncRes = await syncView({ views });
      this.syncLoading = false;

      if (!syncRes?.success) {
        return;
      }

      this.$message({
        message: this.$t("view.sync"),
        type: "success",
      });
      this.onGetList();
    },
    // 生成前端view
    onGenerate() {
      this.shengchengFormVisible = true;
      let bb = this.sels;
      if (bb.length > 0) {
        console.log(this.formConf);
        const script = vueScript(makeUpJs(this.formConf, "file"));
        const html = vueTemplate(makeUpHtml(this.formConf, "file"));
        const css = cssStyle(makeUpCss(this.formConf));
        const codeStr = beautifier.html(
          html + script + css,
          beautifierConf.html
        );
        // let tempstr=require();
        // console.log(tempstr);
        // let template = ejs.compile(tempstr, {});
        // console.log(template(bb[0]));
        //  const codeStr = ejs.render("@/template/cleaning.ejs", bb[0],{})
        // let people = ["geddy", "neil", "alex"];
        // let codeStr = ejs.render('<%= people.join(", "); %>', {
        //   people: people,
        // });
        const blob = new Blob([codeStr], { type: "text/plain;charset=utf-8" });
        console.log(codeStr);
        saveAs(blob, "wodewenjian");
        // //  console.log(ejs.renderFile("@/template/cleaning.ejs", bb[0],{}));
        // ejs.render( "@/template/cleaning.ejs",
        //   bb[0],
        //   {},
        //   function (err, str) {
        //     // str => Rendered HTML string
        //    console.log(err)
        //    console.log(str)
        //   }
        // );
      }
    },
    onSelectAll: function (selection) {
      const selections = treeToList(selection);
      const rows = treeToList(this.viewTree);
      const checked = selections.length === rows.length;
      rows.forEach((row) => {
        this.$refs.multipleTable.toggleRowSelection(row, checked);
      });

      this.sels = this.$refs.multipleTable.selection;
    },
    onSelect: function (selection, row) {
      const checked = selection.some((s) => s.id === row.id);
      if (row.children && row.children.length > 0) {
        const rows = treeToList(row.children);
        rows.forEach((row) => {
          this.$refs.multipleTable.toggleRowSelection(row, checked);
        });
      }

      this.sels = this.$refs.multipleTable.selection;
    },
  },
};
</script>
