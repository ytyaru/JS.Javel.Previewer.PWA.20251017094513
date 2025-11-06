// OS毎の改行コード差を統一する（Windows:/r/n, Mac:/r, を Linux:/n に統一する）
String.prototype.normalizeLineBreaks = function() {return this.replace(/\r\n?/g, '\n');}
