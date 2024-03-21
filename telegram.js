var updateid=0;
var datatable;
var dataFile;
var openFile = function(event) {
    var input = event.target;

    var reader = new FileReader();
    reader.onload = function() {
        var text = reader.result;
        var node = $('#output');
        dataFile=JSON.parse(text);
        var template = Handlebars.compile($('#tmplConfig').html());
        node.html(template(dataFile.config));//JSON.parse(text).data.prop1;
        $('div.telegramstop').removeClass('telegramstop').addClass('telegramstart');
        UpdateTelegram();
    };
    reader.readAsText(input.files[0]);
};
var openFileData = function(event) {
    var input = event.target;
    var reader = new FileReader();
    reader.onload = function() {
        datatable.fnClearTable();
        datatable.fnAddData(JSON.parse(reader.result));
    };
    reader.readAsText(input.files[0]);
};
function UpdateTelegram(){
    //{"ok":true,"result":[{"update_id":820496628,
        //"message":{
            //"message_id":798,"from":{
                //"id":50654474,"is_bot":false,"first_name":"Josep","last_name":"B V","username":"Abuuuuu","language_code":"ca"
            //},
            //"chat":{"id":50654474,"first_name":"Josep","last_name":"B V","username":"Abuuuuu",
                //"type":"private"},
            //"date":1710190263,
            //"text":"Prova Text 1"}}]}
    setTimeout(function(){
        GetMessages();
        UpdateTelegram();
    },1000*$('#segonsupdatelegram').val());
}
function SaveFile(filename,text){
    // Create element with <a> tag
    var link = document.createElement("a");

    // Create a blog object with the file content which you want to add to the file
    var file = new Blob([text], { type: 'text/plain' });

    // Add file content in the object URL
    link.href = URL.createObjectURL(file);

    // Add file name
    link.download = filename;

    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
}
function SendMessage(chatid,message){
    $.get("https://api.telegram.org/bot"+$('#telegramtoken').val()+"/sendMessage?parse_mode=html&chat_id="+chatid+"&text="+message,function(data){
        //{"ok":true,"result":{
            //"message_id":806,
            //"from":{
                //"id":6144449443,"is_bot":true,"first_name":"Boda Carol & Josep 2023",
                //"username":"BodaCarolJosep2023Bot"},
            //"chat":{"id":50654474,"first_name":"Josep","last_name":"B V","username":"Abuuuuu",
                //"type":"private"},
            //"date":1710192902,
            //"text":"Prova Text 7"}}
    });
}
function GetResposta(message){
    var messageoriginal=message;
    message=message.toLowerCase().trim();
    if (dataFile.preguntes.length>0){
        var res='';
        $.each(dataFile.preguntes,function(){
            if (typeof this.pregunta=='string'){
                if (this.pregunta.toLowerCase().trim()==message){
                    res=this.resposta;
                    return false;
                }    
            }else{
                var tempresp=this.resposta;
                $.each(this.pregunta,function(){
                    if (this.toLowerCase().trim()==message){
                        res=tempresp;
                        return false;
                    }    
                });
            }
            if (res!='') return false;
        });
        if (res!=''){
            return res
        }
        $.each(dataFile.paraules,function(){
            if (typeof this.paraula=='string'){
                if (message.indexOf(this.paraula.toLowerCase().trim())>=0){
                    res=this.resposta;
                    return false;
                }
            }else{
                var tempresp=this.resposta;
                $.each(this.paraula,function(){
                    if (message.indexOf(this.toLowerCase().trim())>=0){
                        res=tempresp;
                        return false;
                    }    
                });
            }
            if (res!='') return false;
        });
        if (res!=''){
            return res
        }
        if ($('#notificarpreguntes').is(':checked')==true){
            var chatidnotif=$('#chatidnotificar').val();
            if (chatidnotif.length>0){
                SendMessage(chatidnotif,'Missatge: '+messageoriginal);
            }
        }
        return dataFile.preguntesincorrectes[parseInt(Math.random() * dataFile.preguntesincorrectes.length)];
    }else{
        return message;
    }
}
function GetDateTelegram(value){
    return (new Date(value*1000)).toLocaleString('en-GB');
}
function GetMessages(){
    $.get("https://api.telegram.org/bot"+$('#telegramtoken').val()+"/getUpdates?offset="+updateid,function(data){
        if (data.result.length>0){
            $.each(data.result,function(){
                updateid=this.update_id+1;
                var nom='';
                var alies=''
                if (this.message && this.message.chat){
                    //if (this.message.chat.first_name.lenght>0){
                    //    alert(1);
                    if (this.message.chat.first_name && this.message.chat.first_name.length>0){
                        nom=nom+' '+this.message.chat.first_name;
                    }
                    //}
                    //if (this.message.chat.last_name.lenght>0){
                    //    alert(2);
                    if (this.message.chat.last_name && this.message.chat.last_name.length>0){
                        nom=nom+' '+this.message.chat.last_name;
                    }
                    //}
                    if (this.message.chat.username && this.message.chat.username.length>0){
                        alies=this.message.chat.username;
                    }
                }
                var text='';
                if (this.message && this.message.text && this.message.text.length>0){
                    text=this.message.text;
                }
                try{
                    datatable.fnAddData([GetDateTelegram(this.message.date),nom,alies,text]);
                }catch(e){
                    datatable.fnAddData(['','','',e.message]);
                }
                if (dataFile.comandes.saberchatid && dataFile.comandes.saberchatid==text){
                    SendMessage(this.message.chat.id,this.message.chat.id.toString());
                }else{
                    if (this.message.chat.id==$('#chatidnotificar').val() && dataFile.comandes.modificartemps && dataFile.comandes.modificartemps.length<text.length &&
                        text.substring(0,dataFile.comandes.modificartemps.length)==dataFile.comandes.modificartemps){
                        $('#segonsupdatelegram').val(text.substring(dataFile.comandes.modificartemps.length));
                        SendMessage(this.message.chat.id,"S'ha modificat els temps d'actualització");
                    }else{
                        if (this.message.chat.id==$('#chatidnotificar').val() && dataFile.comandes.afegirparaula && dataFile.comandes.afegirparaula.length<text.length &&
                            text.substring(0,dataFile.comandes.afegirparaula.length)==dataFile.comandes.afegirparaula){
                            var novaparaula=text.substring(dataFile.comandes.afegirparaula.length);
                            novaparaula=novaparaula.split("-");
                            if (novaparaula.length==2){
                                var itemparaula={
                                    paraula:novaparaula[0],
                                    resposta:novaparaula[1]
                                };
                                dataFile.paraules.push(itemparaula);
                                SaveFile('Config'+(new Date().toISOString().split('.')[0].replace(/[^\d]/gi,'')).toString()+'.json',JSON.stringify(dataFile));
                                SendMessage(this.message.chat.id,"S'ha afegit la nova paraula");
                            }else{
                                SendMessage(this.message.chat.id,"No s'ha indicat correctament la nova paraula. S'ha de separar la paraula i la resposta amb un guió. El format correcte es: novaparaula-resposta de la paraula");
                            }
                        }else{
                            if (this.message.chat.id==$('#chatidnotificar').val() && dataFile.comandes.afegirpregunta && dataFile.comandes.afegirpregunta.length<text.length &&
                                text.substring(0,dataFile.comandes.afegirpregunta.length)==dataFile.comandes.afegirpregunta){
                                var novapregunta=text.substring(dataFile.comandes.afegirpregunta.length);
                                novapregunta=novapregunta.split("-");
                                if (novapregunta.length==2){
                                    var itempregunta={
                                        paraula:novapregunta[0],
                                        resposta:novapregunta[1]
                                    };
                                    dataFile.preguntes.push(itempregunta);
                                    SaveFile('Config'+(new Date().toISOString().split('.')[0].replace(/[^\d]/gi,'')).toString()+'.json',JSON.stringify(dataFile));
                                    SendMessage(this.message.chat.id,"S'ha afegit la nova pregunta");
                                }else{
                                    SendMessage(this.message.chat.id,"No s'ha indicat correctament la nova pregunta. S'ha de separar la pregunta i la resposta amb un guió. El format correcte es: text nova pregunta-resposta de la pregunta");
                                }
                            }else{
                                SendMessage(this.message.chat.id,GetResposta(text));
                            }
                        }
                    }
                }
            });
        }
    });
}
$(document).ready(function(){
    $('div.telegramstop').click(function(){
        $('input#uploadconfig[type="file"]').click();
    });
    $('button').button();
    $('button#Guardar').click(function(){
        SaveFile((new Date().toISOString().split('.')[0].replace(/[^\d]/gi,'')).toString()+'.txt',JSON.stringify(datatable.fnGetData()));
    });
    $('button#Carregar').click(function(){
        $('input#uploaddata[type="file"]').click();
    });
    datatable=$('#example').dataTable({
        "sScrollY": document.body.offsetHeight-215+"px",
        "bPaginate": false,
        "bScrollCollapse": true,
        "aaSorting": [[ 0, "desc" ]],
        "oLanguage": {
            "sLengthMenu": "Mostrar _MENU_ missatges per pàgina",
            "sZeroRecords": "No hi ha informació",
            "sInfo": "Mostrar _START_ a _END_ de _TOTAL_ missatges",
            "sInfoEmpty": "Mostrar 0 a 0 de 0 missatges",
            "sInfoFiltered": "(filtrar de _MAX_ missatges totals)"
        },
        "bJQueryUI": true,
        "sPaginationType": "full_numbers"
    });
});
