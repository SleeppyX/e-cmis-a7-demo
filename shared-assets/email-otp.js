(function(global){
  'use strict';

  var STORAGE_KEY = 'ecmis-email-otp-login-v1';
  var OTP_LIFETIME_MS = 5 * 60 * 1000;

  function storage(){ return global.sessionStorage; }
  function read(){
    try{
      var value = JSON.parse(storage().getItem(STORAGE_KEY) || 'null');
      return value && typeof value === 'object' ? value : null;
    }catch(error){ return null; }
  }
  function write(value){
    try{ storage().setItem(STORAGE_KEY, JSON.stringify(value)); return true; }
    catch(error){ return false; }
  }
  function clear(){ try{ storage().removeItem(STORAGE_KEY); }catch(error){} }

  function normalize(value){ return String(value || '').trim(); }
  function findUser(username, password){
    var auth = global.ECMISAuth;
    var users = auth && Array.isArray(auth.USERS) ? auth.USERS : [];
    var normalizedUsername = normalize(username).toLowerCase();
    var normalizedPassword = normalize(password);
    return users.find(function(user){
      return normalize(user.u).toLowerCase() === normalizedUsername && normalize(user.p) === normalizedPassword;
    }) || null;
  }
  function findUserByUsername(username){
    var auth = global.ECMISAuth;
    var users = auth && Array.isArray(auth.USERS) ? auth.USERS : [];
    var normalizedUsername = normalize(username).toLowerCase();
    return users.find(function(user){ return normalize(user.u).toLowerCase() === normalizedUsername; }) || null;
  }

  function latestRegisteredGmail(){
    try{
      var registrations = JSON.parse(global.localStorage.getItem('ecmis-registration-requests') || '[]');
      if(!Array.isArray(registrations)) return '';
      var latest = registrations.slice().reverse().find(function(item){
        var email = normalize(item && (item.gmail || item.email)).toLowerCase();
        return /@gmail\.com$/.test(email);
      });
      return latest ? normalize(latest.gmail || latest.email).toLowerCase() : '';
    }catch(error){ return ''; }
  }

  function emailForUser(user, enteredUsername){
    var entered = normalize(enteredUsername);
    if(entered.indexOf('@') > 0) return entered.toLowerCase();
    var registeredGmail = latestRegisteredGmail();
    if(registeredGmail) return registeredGmail;
    var local = normalize(user && user.u).toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'officer';
    return local + '@gmail.com';
  }
  function maskEmail(email){
    var parts = normalize(email).split('@');
    if(parts.length !== 2 || !parts[0]) return 'อีเมลที่ลงทะเบียนไว้';
    var local = parts[0];
    var visible = local.length > 2 ? local.slice(0,2) : local.slice(0,1);
    return visible + '****@' + parts[1];
  }
  function createOtp(){
    var number;
    try{
      var values = new Uint32Array(1);
      global.crypto.getRandomValues(values);
      number = values[0];
    }catch(error){ number = Math.floor(Math.random() * 0xffffffff); }
    return String(100000 + (number % 900000));
  }
  function safeNext(next){
    var value = normalize(next);
    if(!value || /^(?:[a-z]+:|\/\/|\\)/i.test(value)) return '';
    if(value.charAt(0) !== '/' && value.indexOf('./') !== 0 && value.indexOf('../') !== 0) return '';
    return value;
  }
  function defaultLanding(account){
    return './intake-investigation/staff-workflow.html?role=admin&queue=unassigned';
  }

  function begin(username, password, next){
    var user = findUser(username, password);
    if(!user) return {ok:false, reason:'invalid-credentials'};
    var auth = global.ECMISAuth;
    if(auth && typeof auth.logout === 'function') auth.logout();
    var now = Date.now();
    var email = emailForUser(user, username);
    var context = {
      username:user.u,
      email:email,
      maskedEmail:maskEmail(email),
      otp:createOtp(),
      issuedAt:now,
      expiresAt:now + OTP_LIFETIME_MS,
      returnTo:safeNext(next)
    };
    if(!write(context)) return {ok:false, reason:'storage'};
    return {ok:true, account:user, maskedEmail:context.maskedEmail, url:'./email-otp.html?source=credentials'};
  }

  function current(){
    var context = read();
    if(!context) return null;
    if(Number(context.expiresAt) <= Date.now()) return null;
    return context;
  }
  function resend(){
    var context = read();
    if(!context) return {ok:false, reason:'invalid-session'};
    var now = Date.now();
    context.otp = createOtp();
    context.issuedAt = now;
    context.expiresAt = now + OTP_LIFETIME_MS;
    if(!write(context)) return {ok:false, reason:'storage'};
    return {ok:true, context:context};
  }
  function verify(code){
    var context = current();
    if(!context) return {ok:false, reason:'invalid-session'};
    var normalized = normalize(code).replace(/\D/g, '');
    if(!normalized) return {ok:false, reason:'format'};
    var user = findUserByUsername(context.username);
    var auth = global.ECMISAuth;
    if(!user || !auth || typeof auth.login !== 'function') return {ok:false, reason:'account'};
    var account = auth.login(user.u, user.p);
    if(!account) return {ok:false, reason:'account'};
    var url = defaultLanding(account);
    clear();
    return {ok:true, account:account, url:url};
  }

  global.ECMISEmailOtp = {
    STORAGE_KEY:STORAGE_KEY,
    begin:begin,
    current:current,
    resend:resend,
    verify:verify,
    clear:clear,
    _testing:{maskEmail:maskEmail, safeNext:safeNext, createOtp:createOtp}
  };
})(window);
