$(document).ready(function(){
    try{
        var sock = new WebSocket('ws://' + window.location.host + '/ws');
    }
    catch(err){
        var sock = new WebSocket('wss://' + window.location.host + '/ws');
    }

    var colors = ['green', 'red', 'yellow', 'blue'],
        fillCollor = Object.create(null);

    function getUserId(){
        var msg = $('#message');
        return msg.data('id');
    }

    function createMessageBox(ob){
        var date = new Date(),
            options = {hour12: false},
            id = getUserId(),
            message = [
            "<div id=" + ob.id + " data-user-id=" + ob.user_id + " class='chat-div-line clearfix'>",
            " <div class='text-user-inline'>",
            "  <time>[" + date.toLocaleTimeString('en-US', options) + "]</time>",
            "  <span class='userlogin " + ob.colorname + "'>" + ob.username + "</span>",
            "  <span class='message'>" + ob.message + "</span>",
            " </div>"],
            buttons = [
            " <div class='button-right'>",
            "  <button type='button' class='edit btn btn-warning btn-sm'>",
            "   <span class='glyphicon glyphicon-pencil' aria-hidden=\"true\"></span> Edit",
            "  </button>",
            "  <button type='button' class='remove btn btn-danger btn-sm'>",
            "   <span class='glyphicon glyphicon-remove' aria-hidden=\"true\"></span> Remove",
            "  </button>",
            " </div>",
            "</div>"
            ],
            array = message;
        if (ob.user_id == id){
            array = $.merge(array, buttons);
        }
        return $(array.join('\n'));
    }

    // show message in div#subscribe
    function showMessage(ob) {
        var messageElem = $('#subscribe'),
            height = 0,
            m = createMessageBox(ob);
        messageElem.append(m);
        messageElem.find('div').each(function(i, value){
            height += parseInt($(this).height());
        });

        messageElem.animate({scrollTop: height});
    }

    // This message shows when some system events happens
    function getSystemMessage(m){
        return {'username': 'System','id': 0, 'user_id': 0, 'colorname':'black', 'message': m};
    }

    function sendMessage(obj){
        sock.send(JSON.stringify(obj));
    }

    function sendMessageFromInput(){
        var msg = $('#message'),
            mes = msg.val();
        if (mes.length > 0){
            var obj = {'message': mes, 'user_id': msg.data('id')};
            sendMessage(obj);
            msg.val('').focus();
        }
    }

    sock.onopen = function(){
        showMessage(getSystemMessage('Connection to server started'));
    };

    // send message from form
    $('#submit').click(function() {
        sendMessageFromInput();
    });

    $('#message').keyup(function(e){
        if(e.keyCode == 13){
            sendMessageFromInput();
        }
    });

    $('body').on('click', '.edit', function(){
        var par = $(this).parent().parent()[0],
            id = par.id;
        var modal = $('#editModal');
        modal.data("id", id);
        modal.css('display', 'block');
    });

    $('body').on('click', '.remove', function(){
        var par = $(this).parent().parent()[0],
            id = par.id;
        sendMessage({user_id: getUserId(), id:+id, is_delete: true});
    });

    $('#saveButton').click(function(){
        var modal = $('#editModal'),
            id = modal.data()['id'],
            message=$(this).prev().prev().val();
        sendMessage({message: message, id: +id, user_id: getUserId()});
        modal.css('display', 'none');
    });

    // income message handler
    sock.onmessage = function(event) {
        var obj = JSON.parse(event.data),
            message_div = $("#" + obj.id);
        if (message_div.length){
            if (obj.is_delete){
                message_div.remove();
                return
            }
            message_div.find('.message').html(obj.message);
        } else {
            if (obj.user_id in fillCollor){
                obj.colorname = fillCollor[obj.user_id];
            }else{
                var color = colors[Math.floor(Math.random() * colors.length)];
                obj.colorname = color;
                fillCollor[obj.user_id] = color;
            }
            showMessage(obj);
        }
    };

    $('#signout').click(function(){
        window.location.href = "signout";
    });

    sock.onclose = function(event){
        if(event.wasClean){
            showMessage(getSystemMessage('Clean connection end'));
        }else{
            showMessage(getSystemMessage('Connection broken'));
        }
    };

    sock.onerror = function(error){
        showMessage(getSystemMessage(error));
    };
});
