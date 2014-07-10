(function () {
    /* MSIE support for custom and mouse events API */
    if(!/(MSIE)|(Trident)/.test(navigator.userAgent)) return ;

    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    };

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;

    function MouseEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'MouseEvent' );
        evt.initMouseEvent(event, params.bubbles, params.cancelable, window,
                0, 0, 0, 80, 20, false, false, false, false, 0, null);
        return evt;
    };

    MouseEvent.prototype = window.Event.prototype;

    window.MouseEvent = MouseEvent;
})();

(function(){
    function moveCursorToEnd(el) {
        if(el.type === 'email' || el.type === 'checkbox' || el.type === 'submit') return ;

        if (typeof el.selectionStart == "number") {
            el.selectionStart = el.selectionEnd = el.value.length;
        } else if (typeof el.createTextRange != "undefined") {
            el.focus();
            var range = el.createTextRange();
            range.collapse(false);
            range.select();
        }
    }

    function trackInputs(){
        var inputs = document.querySelectorAll("input");
    
        for(var i=0; i<inputs.length; i++){
            inputs[i].addEventListener("focus", function(e){
                moveCursorToEnd(e.target);
            });

            inputs[i].addEventListener("blur", function(e){
                setTimeout(function(){
                    if(["input", "select"].indexOf(document.activeElement.nodeName.toLowerCase()) < 0){
                        window.scrollTo(0,0);    
                    }
                },100);
            });
        }        

        var tas = document.querySelectorAll("textarea");
    
        for(var i=0; i<tas.length; i++){
            tas[i].addEventListener("focus", function(e){
                moveCursorToEnd(e.target);
            });

            tas[i].addEventListener("blur", function(e){
                window.scrollTo(0,0);
            });
        }        
    }

    function trackSelects(){
        var elements = document.querySelectorAll("select");
    
        for(var i=0; i<elements.length; i++){
            elements[i].addEventListener("focus", function(e){
                e.target.parentNode.querySelector(".select").classList.add("focus");
            });

            elements[i].addEventListener("blur", function(e){
                e.target.parentNode.querySelector(".select").classList.remove("focus");

                setTimeout(function(){
                    if(["input", "select"].indexOf(document.activeElement.nodeName.toLowerCase()) < 0){
                        window.scrollTo(0,0);    
                    }
                },100);
            });

            elements[i].addEventListener("change", function(e){
                e.target.parentNode.querySelector(".select").innerHTML = e.target.options[this.selectedIndex].text;
            });
        }
    }

    function trackElementsForValidation(){
        var forms = document.querySelectorAll("form");

        for(var i=0; i<forms.length; i++){
            var submitAction = forms[i].querySelector("[data-submit=true]");
            
            if(submitAction) {
                submitAction.addEventListener("click", function(e){
                    var parentForm = this.parentElement;
                    
                    while(parentForm){
                        if(parentForm.nodeName.toLowerCase() === 'form'){ 
                            var submitButton = parentForm.querySelector("input[type=submit]");
                            
                            var evt = new MouseEvent('click', {
                                'view': window,
                                'bubbles': true,
                                'cancelable': true
                            });
                    
                            submitButton.dispatchEvent(evt);

                            return ;
                        }
                        parentForm = parentForm.parentElement;
                    }
                });
            }

            forms[i].addEventListener('submit', function(e){
                var isValid = true;
                var required = this.querySelectorAll("[data-required]");
                var validate = this.querySelectorAll("[data-validate]");
                var skipFurtherValidation = [];

                for(var j = 0; j < required.length; j++){
                    if(!validateRequired.apply(required[j])){
                        isValid = false;
                        skipFurtherValidation.push(required[j]);
                    }
                }

                for(var j = 0; j < validate.length; j++){
                    if(skipFurtherValidation.indexOf(validate[j]) > -1) continue ;
                    if(!validateValue.apply(validate[j])){
                        isValid = false;
                    }
                }

                if(isValid){ 
                    this.dispatchEvent(new CustomEvent("send"));
                    if(document.activeElement && document.activeElement.blur){
                        document.activeElement.blur();
                    }
                }

                e.preventDefault();
                return false;
            });
        }
    }

    function validateRequired(){
        if(this.nodeName.toLowerCase() === "select"){
            if(this.options[this.selectedIndex].value <= 0 || this.options[this.selectedIndex].value == null){
                var evt = new CustomEvent("validation", {detail: "Please select a value."});
                this.dispatchEvent(evt);

                return false;
            }
            else{
                var evt = new CustomEvent("validation", {detail: void 0});
                this.dispatchEvent(evt);

                return true;   
            }
        }

        if(this.nodeName.toLowerCase() === "input" && this.getAttribute("type") === 'checkbox'){
            if(this.checked !== true){
                var evt = new CustomEvent("validation", {detail: "This field is required."});
                this.dispatchEvent(evt);

                return false;
            }
            else{
                var evt = new CustomEvent("validation", {detail: void 0});
                this.dispatchEvent(evt);

                return true;   
            }
        }

        if(this.nodeName.toLowerCase() === "input" && this.getAttribute("type") !== 'checkbox' && this.getAttribute("type") !== 'radio'){
            if(this.value.toString().trim() === ""){
                var evt = new CustomEvent("validation", {detail: "This field is required."});
                this.dispatchEvent(evt);

                return false;
            }
            else{
                var evt = new CustomEvent("validation", {detail: void 0});
                this.dispatchEvent(evt);

                return true;   
            }
        }
    }

    function validateValue(){
        if(this.nodeName.toLowerCase() === "select"){
            if(this.getAttribute("data-different")){    
                var differentFromSelect = document.getElementById(this.getAttribute("data-different"));
                if(this.options[this.selectedIndex].value === differentFromSelect.options[differentFromSelect.selectedIndex].value){
                    var evt = new CustomEvent("validation", {detail: "Selected value needs to be different."});
                    this.dispatchEvent(evt);
                    
                    return false;
                }
                else{
                    var evt = new CustomEvent("validation", {detail: void 0});
                    this.dispatchEvent(evt);
                    
                    return true;   
                }
            }
        }

        if(this.nodeName.toLowerCase() === "input" && this.getAttribute("type") !== 'checkbox' && this.getAttribute("type") !== 'radio'){
            if(this.getAttribute("data-validate") === 'email'){
                var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if(!emailRegex.test(this.value)){
                    var evt = new CustomEvent("validation", {detail: "Email is not valid."});
                    this.dispatchEvent(evt);
                    
                    return false;
                }
                else{
                    var evt = new CustomEvent("validation", {detail: void 0});
                    this.dispatchEvent(evt);

                    return true;   
                }
            }
            
            if(this.getAttribute("data-validate") === 'length'){
                var length = parseInt(this.getAttribute("data-length"));
                if(this.value.length < length){
                    var evt = new CustomEvent("validation", {detail: "The length of the field is less than {0}.".replace(/\{0\}/ig, length)});
                    this.dispatchEvent(evt);

                    return false;
                }
                else{
                    var evt = new CustomEvent("validation", {detail: void 0});
                    this.dispatchEvent(evt);

                    return true;   
                }
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function(e){
        trackElementsForValidation();

        trackInputs();

        trackSelects();        
    });
})(this);