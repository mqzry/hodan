define(["xaml!app/view/Image"], function(Image){

    return Image.inherit('app.view.LikeDesignClass',{
        // custom event definition
        events: ["on:Voted"],
        Vote: function(vote){
            var eventData = {
                "vote": vote
            };
            console.log(eventData);
            this.trigger("on:Voted", eventData)
        },
        
        // defaults: {
        //     design: null,
        // },
        // imageUrl: function () {
        //     return this.$.design.resource || this.$.src;
        // }.onChange('design'),
    });
});