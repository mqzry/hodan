define(["js/ui/View"], function(View){

    return View.inherit('app.view.DesignView',{
        defaults: {
            design: null,
            like: null
        },
        $classAttributes: ['todo', 'inputElement'],

        events: ["on:remove"],

        editTodo: function (e) {
            this.set("editing", true);
            e.preventDefault();

            this.$.inputElement.$el.select();
            return false;
        },

        checkTodo: function () {
            var todo = this.get("todo");
            todo.setCompleted(!todo.isCompleted());
            todo.save();
        },

        preventEditing: function (e) {
            e.stopPropagation();
        },

        updateTodo: function (e) {
            var todo;
            if (e.domEvent.keyCode === ENTER_KEY || e.domEvent.type === INPUT_BLUR) {
                todo = this.get("todo");
                if (!todo.hasTitle()) {
                    this.trigger("on:remove", todo);
                } else {
                    this.set("editing", false);
                    todo.save();
                }
            }
        },

        triggerOnRemove: function () {
            this.trigger("on:remove", this.get("todo"));
        },

        _renderEditing: function (editing) {
            if (editing) {
                this.addClass("editing");
            } else {
                this.removeClass("editing");
                this.$.inputElement.$el.blur();
            }
        },

        trim: function (title) {
            if (title) {
                return title.trim();
            }
            return "";
        }

    });
});