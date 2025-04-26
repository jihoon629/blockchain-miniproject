'use strict';

var app = angular.module('application', []);

app.controller('AppCtrl', function($scope, appFactory){
  // 초기화 및 숨김 처리
  $("#success_init").hide();
  $("#success_qurey").hide();
  $("#success_invoke").hide();
  $("#success_delete").hide();
  $("#success_query_all").hide();
  $("#success_deposit").hide();
  $("#success_withdraw").hide();
  $("#success_create_item").hide();
  $("#success_query_all_items").hide();
  $("#success_escrow_action").hide(); // 에스크로 액션 성공 메시지
  $("#success_query_escrow").hide(); // 에스크로 조회 성공 메시지
  $("#error_invoke").hide();
  $("#error_delete").hide();
  $("#error_query_all").hide();
  $("#error_query").hide();
  $("#error_deposit").hide();
  $("#error_withdraw").hide();
  $("#error_create_item").hide();
  $("#error_query_all_items").hide();
  $("#error_escrow_action").hide(); // 에스크로 액션 에러 메시지
  $("#error_query_escrow").hide(); // 에스크로 조회 에러 메시지

  $scope.query_all_result = [];
  $scope.allItems = [];
  $scope.abstore = { a: '', aval: 0 };
  $scope.deposit = { amount: null };
  $scope.withdraw = { amount: null };
  $scope.itemData = { id: '', name: '', price: null, seller: '' };
  $scope.escrowData = { id: '', amount: null }; // 에스크로 관련 입력 데이터
  $scope.escrowQueryResult = null; // 에스크로 조회 결과 저장
  $scope.storedUserId = sessionStorage.getItem('userId');



  // (선택 사항) 세션 ID를 스코프에 바인딩하여 HTML에 표시
  $scope.storedUserId = sessionStorage.getItem('userId');
  if (!$scope.storedUserId) {
      console.warn("세션 스토리지에 사용자 ID가 없습니다. 먼저 지갑을 생성/초기화해주세요.");
      // 필요시 사용자에게 메시지 표시
  }
  $scope.initAB = function(){
    // 입력된 아이디가 있는지 확인
    if ($scope.abstore && $scope.abstore.a && $scope.abstore.a.trim() !== '') {
        // 1. 아이디를 sessionStorage에 저장 ('userId'라는 키 사용)
        try {
            sessionStorage.setItem('userId', $scope.abstore.a.trim());
            console.log('사용자 ID가 세션 스토리지에 저장되었습니다:', $scope.abstore.a.trim());

            // 2. 기존 팩토리 호출하여 원장 초기화/지갑 생성 요청
            appFactory.initAB($scope.abstore, function(data){
                // 응답 데이터가 비어있거나, 성공을 나타내는 특정 형태인지 확인
                // (서버 응답 형식에 따라 이 조건은 달라질 수 있습니다)
                if(data === "" || (data && data.result === "success")) { // 서버 응답이 비어있거나 성공 객체일 경우
                     // 성공 메시지 설정 (저장된 ID 포함)
                    $scope.init_ab = "지갑 생성/초기화 성공 (ID: " + $scope.abstore.a.trim() + ")";
                    $("#success_init").show();
                    $("#error_invoke").hide(); // 다른 오류 메시지 숨김
                    $("#error_delete").hide();

                    // 선택 사항: 성공 후 입력 필드 초기화
                    // $scope.abstore.a = '';

                } else {
                    // 실패 처리 (서버에서 오류 메시지를 보낸다고 가정)
                    let errorMessage = "지갑 생성/초기화 실패";
                    if (data && data.error) {
                         errorMessage += ": " + data.error;
                    } else if (typeof data === 'string' && data.length > 0) {
                         errorMessage += ": " + data;
                    }
                     $scope.init_ab = errorMessage;
                    $("#success_init").show(); // 실패 메시지도 같은 영역에 표시 (필요시 다른 요소 사용)
                    console.error("지갑 생성/초기화 실패 응답:", data);
                }
            });

        } catch (e) {
            // sessionStorage 저장 실패 처리 (예: Quota 초과 등)
            console.error("세션 스토리지 저장 실패:", e);
            $scope.init_ab = "오류: 세션 스토리지에 ID를 저장할 수 없습니다.";
            $("#success_init").show();
        }

    } else {
        // 아이디가 입력되지 않은 경우
        $scope.init_ab = "오류: 지갑 생성을 위한 아이디를 입력해주세요.";
        $("#success_init").show(); // 오류 메시지 표시
         console.warn("지갑 생성을 위한 아이디가 입력되지 않았습니다.");
    }
}; 
$scope.queryAB = function(){
    // walletid는 index.html의 ng-model="walletid"와 일치
    var walletIdToQuery = $scope.walletid;
    $("#success_qurey").hide(); // 이전 결과 숨김
    $("#error_query").hide();   // 이전 오류 숨김

    appFactory.queryAB(walletIdToQuery, function(data, status){ // status 인자 추가
        if (status === 200) { // HTTP 200 OK: 성공
            // 성공 응답 처리
            try {
                if (typeof data === 'object') { // sdk.js 에서 이미 파싱된 경우
                    $scope.query_ab = JSON.stringify(data, null, 2);
                } else {
                    // 체인코드가 값만 반환하는 현재 로직 기준
                    $scope.query_ab = "Account: " + walletIdToQuery + "\nValue: " + data;
                }
            } catch(e) {
                 $scope.query_ab = data; // 파싱 실패 시 원본 표시
            }
            $("#success_qurey").show(); // 성공 메시지 표시
        } else { // HTTP 200 이 아닌 경우: 오류 발생
            var errorMsg = "Query failed: ";
            // 오류 응답(data) 내용 분석
            // (체인코드 오류 메시지가 "account not found" 인 경우 data.error.includes 사용)
            // 현재 체인코드 오류 메시지("Nil amount for") 기준
            if (data && data.error && data.error.includes("Nil amount for " + walletIdToQuery)) {
               errorMsg = "Account '" + walletIdToQuery + "' not found.";
            } else if (data && data.error) { // 서버에서 보낸 다른 오류 메시지가 있는 경우
               errorMsg += data.error;
            } else if (typeof data === 'string' && data.length > 0) { // 오류 응답이 문자열인 경우
                errorMsg += data;
            } else { // 기타 오류
               errorMsg += "Status " + status + " - " + JSON.stringify(data);
            }
            $scope.query_ab_error = errorMsg; // 에러 스코프 변수에 저장
            $("#error_query").show(); // 에러 메시지 표시
        }
        // 다른 섹션 메시지 숨김 (Query 오류 발생 시에도 다른 성공/오류는 숨김)
        $("#success_init").hide();
        $("#success_invoke").hide();
        $("#success_delete").hide();
        $("#success_query_all").hide();
        $("#error_invoke").hide();
        $("#error_delete").hide();
        $("#error_query_all").hide();
    });
}

 // Invoke 함수 추가
 $scope.invoke = function(){
    // 입력값 가져오기 (index.html의 ng-model과 일치해야 함: invokeData.A, invokeData.B, invokeData.X)
    appFactory.invoke($scope.invokeData, function(data, status){
        $("#success_invoke").hide(); // 이전 메시지 숨김
        $("#error_invoke").hide();
        if(status === 200 && data === "") { // 성공 응답 (body가 비어있음)
            $scope.invoke_result = "Transaction Invoke successful!";
            $("#success_invoke").show();
        } else { // 오류 응답
            $scope.invoke_error = "Invoke failed: " + (data.error || JSON.stringify(data)); // 오류 메시지 표시
            $("#error_invoke").show();
        }
        $("#success_init").hide(); // 다른 섹션 메시지 숨김
        $("#success_qurey").hide();
        $("#success_delete").hide();
        $("#error_delete").hide();
    });
}

// Delete 함수 추가
$scope.deleteAccount = function(){
    // 입력값 가져오기 (index.html의 ng-model과 일치해야 함: deleteName)
    appFactory.deleteAccount($scope.deleteName, function(data, status){
        $("#success_delete").hide(); // 이전 메시지 숨김
        $("#error_delete").hide();
        if(status === 200 && data === "") { // 성공 응답 (body가 비어있음)
             $scope.delete_result = "Account '" + $scope.deleteName + "' deleted successfully!";
            $("#success_delete").show();
        } else { // 오류 응답
            $scope.delete_error = "Delete failed: " + (data.error || JSON.stringify(data)); // 오류 메시지 표시
            $("#error_delete").show();
        }
         $("#success_init").hide(); // 다른 섹션 메시지 숨김
         $("#success_qurey").hide();
         $("#success_invoke").hide();
         $("#error_invoke").hide();
    });
}


 // Query All 함수 추가
 $scope.queryAll = function(){
    console.log("Query All button clicked.");
    $scope.query_all_result = [];
    appFactory.queryAll(function(data, status){
        console.log("Received response from /queryAll - Status:", status);
        $("#error_query_all").hide();
        if(status === 200) {
            console.log("Raw data received:", data);
            try {
                let firstParsedData; // 첫 번째 파싱 결과를 담을 변수
                let finalResultArray = []; // 최종 객체 배열을 담을 변수

                // 서버 응답이 문자열인지 확인
                if (typeof data === 'string') {
                    console.log("Data is a string, attempting first JSON.parse().");
                    firstParsedData = JSON.parse(data); // 첫 번째 파싱: JSON 문자열 배열 -> JS 문자열 배열
                    
                } else if (Array.isArray(data)) {
                    // sdk.js 에서 이미 첫번째 파싱을 했을 수도 있음
                    console.log("Data is already an array (likely pre-parsed).");
                    firstParsedData = data;
                } else {
                     console.error("Received data is neither a string nor an array:", data);
                     throw new Error("Unexpected data format received.");
                }


                // 첫 번째 파싱 결과가 배열인지 확인
                if (Array.isArray(firstParsedData)) {
                    console.log("First parse result is an array. Attempting second parse on each element.");
                    // 배열의 각 문자열 요소를 순회하며 두 번째 파싱 수행
                    for (let i = 0; i < firstParsedData.length; i++) {
                        try {
                            // 각 요소가 문자열인지 확인 후 파싱
                            if (typeof firstParsedData[i] === 'string') {
                                finalResultArray.push(JSON.parse(firstParsedData[i])); // 두 번째 파싱: JSON 문자열 -> JS 객체
                            } else if (typeof firstParsedData[i] === 'object') {
                                // 이미 객체 형태일 경우 (예: sdk.js 에서 이중 파싱까지 한 경우)
                                finalResultArray.push(firstParsedData[i]);
                            } else {
                                console.warn("Skipping non-string/non-object element in array:", firstParsedData[i]);
                            }
                        } catch (parseError) {
                             console.error("Error parsing element at index " + i + ":", firstParsedData[i], parseError);
                             // 파싱 오류가 난 요소는 건너뛰거나, 오류 처리를 할 수 있음
                        }
                    }
                    $scope.query_all_result = finalResultArray; // <<< 최종 객체 배열을 scope에 할당
                    console.log("Assigned scope data ($scope.query_all_result):", $scope.query_all_result);
                } else {
                    console.error("First parse result is not an array:", firstParsedData);
                    throw new Error("Result after first parse is not an array.");
                }
            } catch (e) {
                // 파싱 실패
                console.error("Error processing queryAll result:", e);
                console.error("Original data:", data);
                $scope.query_all_error = "Failed to process Query All result.";
                $scope.query_all_result = [];
                $("#error_query_all").show();
            }
        } else { // 오류 응답
            console.error("API call failed.");
            console.error("Error status:", status, "Error data:", data);
            $scope.query_all_error = "Query All failed: " + (data.error || JSON.stringify(data));
            $scope.query_all_result = [];
            $("#error_query_all").show();
        }
 
        // 다른 섹션 메시지 숨김 (필요시)
        $("#success_init").hide();
        $("#success_qurey").hide();
        $("#success_invoke").hide();
        $("#success_delete").hide();
        $("#error_invoke").hide();
        $("#error_delete").hide();
        $("#error_query").hide();
    });
}


$scope.depositMoney = function(){
    console.log("Deposit button clicked. Amount:", $scope.deposit.amount);
    $("#success_deposit").hide(); // 이전 메시지 숨김
    $("#error_deposit").hide();

    // 1. 세션 스토리지에서 ID 가져오기
    const id = sessionStorage.getItem('userId');
    const amount = $scope.deposit.amount;

    // 2. ID 및 금액 유효성 검증
    if (!id) {
        $scope.deposit_error = "세션에 저장된 Wallet ID가 없습니다. 먼저 지갑을 생성해주세요.";
        $("#error_deposit").show();
        return;
    }
    if (amount === null || amount === undefined || amount <= 0 || isNaN(amount)) {
         $scope.deposit_error = "입금할 금액을 올바르게 입력해주세요 (양수).";
         $("#error_deposit").show();
         return;
    }

    // 3. 팩토리 함수 호출 (ID와 금액 전달)
    // deposit.id 대신 세션에서 가져온 id 사용
    appFactory.depositMoney({ id: id, amount: amount }, function(data, status){
        console.log("Response from /deposit:", status, data);
        if(status === 200 && (data === "" || (data && data.result === "success"))) { // 성공 응답
            $scope.deposit_msg = `ID '${id}'에 ${amount} 입금 성공!`;
            $("#success_deposit").show();
            // 성공 시 금액 입력 필드 초기화 (선택 사항)
            $scope.deposit.amount = null;
        } else { // 오류 응답
            let errorMsg = "입금 실패: ";
            if (data && data.error) {
                 errorMsg += data.error;
            } else if (typeof data === 'string' && data.length > 0) {
                errorMsg += data;
            } else {
                 errorMsg += `Status ${status}`;
            }
            $scope.deposit_error = errorMsg;
            $("#error_deposit").show();
        }
        // 다른 섹션 메시지 숨김 ... (기존과 동일)
        $("#success_init").hide();
        $("#success_qurey").hide();
        // ... (나머지 메시지 숨김 코드) ...
    });
}; // $scope.depositMoney 끝


// --- 새로운 함수: 돈 출금 ---
$scope.withdrawMoney = function(){
    console.log("Withdraw button clicked. Amount:", $scope.withdraw.amount);
    $("#success_withdraw").hide(); // 이전 메시지 숨김
    $("#error_withdraw").hide();

    // 1. 세션 스토리지에서 ID 가져오기
    const id = sessionStorage.getItem('userId');
    const amount = $scope.withdraw.amount;

    // 2. ID 및 금액 유효성 검증
    if (!id) {
        $scope.withdraw_error = "세션에 저장된 Wallet ID가 없습니다. 먼저 지갑을 생성해주세요.";
        $("#error_withdraw").show();
        return;
    }
    if (amount === null || amount === undefined || amount <= 0 || isNaN(amount)) {
         $scope.withdraw_error = "출금할 금액을 올바르게 입력해주세요 (양수).";
         $("#error_withdraw").show();
         return;
    }

    // 3. 팩토리 함수 호출 (ID와 금액 전달)
    appFactory.withdrawMoney({ id: id, amount: amount }, function(data, status){
        console.log("Response from /withdraw:", status, data);
        if(status === 200 && (data === "" || (data && data.result === "success"))) { // 성공 응답
            $scope.withdraw_msg = `ID '${id}'에서 ${amount} 출금 성공!`;
            $("#success_withdraw").show();
            // 성공 시 금액 입력 필드 초기화 (선택 사항)
            $scope.withdraw.amount = null;
        } else { // 오류 응답
            let errorMsg = "출금 실패: ";
            if (data && data.error) {
                // 체인코드에서 보낸 오류 메시지 (예: "insufficient funds...") 포함
                 errorMsg += data.error;
            } else if (typeof data === 'string' && data.length > 0) {
                errorMsg += data;
            } else {
                 errorMsg += `Status ${status}`;
            }
            $scope.withdraw_error = errorMsg;
            $("#error_withdraw").show();
        }
        // 다른 섹션 메시지 숨김
        $("#success_init").hide();
        $("#success_qurey").hide();
        $("#success_invoke").hide();
        $("#success_delete").hide();
        $("#success_query_all").hide();
        $("#success_deposit").hide();
        $("#error_init").hide();
        $("#error_qurey").hide();
        $("#error_invoke").hide();
        $("#error_delete").hide();
        $("#error_query_all").hide();
        $("#error_deposit").hide();
    });
};


$scope.createItem = function(){
    console.log("Create Item button clicked. Item data:", $scope.itemData);
    $("#success_create_item").hide(); // 이전 메시지 숨김
    $("#error_create_item").hide();

    const { id, name, price, seller } = $scope.itemData;

    // 1. 입력값 유효성 검증
    if (!id || !name || price === null || price === undefined || price <= 0 || isNaN(price) || !seller) {
        $scope.create_item_error = "상품 ID, 이름, 가격(양수), 판매자 ID를 모두 올바르게 입력해주세요.";
        $("#error_create_item").show();
        return;
    }

    // 2. 판매자 ID를 세션 스토리지 ID로 설정 (선택 사항: 또는 직접 입력)
    // 여기서는 입력된 seller 값을 사용하도록 함. 필요시 세션 ID로 대체 가능.
    // const sellerId = sessionStorage.getItem('userId');
    // if (!sellerId) { ... 에러 처리 ... }
    // const itemDataToSend = { ...$scope.itemData, seller: sellerId };

    // 3. 팩토리 함수 호출
    appFactory.createItem($scope.itemData, function(data, status){
        console.log("Response from /items (CreateItem):", status, data);
        if(status === 200 && (data === "" || (data && data.result === "success"))) { // 성공 응답
            $scope.create_item_msg = `상품 '${name}' (ID: ${id}) 등록 성공!`;
            $("#success_create_item").show();
            // 성공 시 입력 필드 초기화 (선택 사항)
            $scope.itemData = { id: '', name: '', price: null, seller: '' };
        } else { // 오류 응답
            let errorMsg = "상품 등록 실패: ";
            if (data && data.error) {
                errorMsg += data.error; // 서버에서 보낸 오류 메시지 (예: "Item already exists")
            } else if (typeof data === 'string' && data.length > 0) {
                errorMsg += data;
            } else {
                errorMsg += `Status ${status}`;
            }
            $scope.create_item_error = errorMsg;
            $("#error_create_item").show();
        }
        // 다른 섹션 메시지 숨김 (기존과 유사하게 추가)
        $("#success_init").hide();
        $("#success_qurey").hide();
        $("#success_invoke").hide();
        $("#success_delete").hide();
        $("#success_query_all").hide();
        $("#success_deposit").hide();
        $("#error_init").hide();
        $("#error_qurey").hide();
        $("#error_invoke").hide();
        $("#error_delete").hide();
        $("#error_query_all").hide();
        $("#error_deposit").hide();    });
}; // $scope.createItem 끝

$scope.queryAllItems = function(){
    console.log("Query All Items button clicked.");
    $("#success_query_all_items").hide();
    $("#error_query_all_items").hide();
    $scope.allItems = []; // 이전 결과 초기화

    appFactory.queryAllItems(function(data, status){
        console.log("Raw data received for items:", data);
        console.log("Response status:", status);

        if(status === 200) {
            try {
                let parsedData;
                // 1. 데이터가 문자열이면 JSON.parse() 시도
                if (typeof data === 'string') {
                    parsedData = JSON.parse(data);
                } else {
                    // 문자열이 아니면 그대로 사용 (혹시 이미 파싱된 경우 대비)
                    parsedData = data;
                }

                // 2. 파싱된 데이터가 배열인지 확인
                if (Array.isArray(parsedData)) {
                    $scope.allItems = parsedData; // 파싱된 배열을 할당
                    console.log("Assigned scope data ($scope.allItems):", $scope.allItems);
                } else {
                    // 파싱 후에도 배열이 아닌 경우
                    console.error("Parsed data is not an array:", parsedData);
                    throw new Error("Unexpected data format after parsing for items list.");
                }
            } catch (e) {
                console.error("Error processing queryAllItems result:", e);
                // 오류 메시지를 조금 더 구체적으로 표시 (예: 파싱 오류 포함)
                $scope.query_all_items_error = "상품 목록 처리 실패: " + e.message;
                $("#error_query_all_items").show();
            }
        } else { // 오류 응답
            console.error("API call failed for QueryAllItems.");
            let errorMsg = "상품 목록 조회 실패: ";
             if (data && data.error) {
                errorMsg += data.error;
            } else if (typeof data === 'string' && data.length > 0) {
                errorMsg += data;
            } else {
                 errorMsg += `Status ${status}`;
            }
            $scope.query_all_items_error = errorMsg;
            $("#error_query_all_items").show();
        }
         // 다른 섹션 메시지 숨김 (필요시)
         // $("#success_init").hide(); ...
    });
}; // $scope.queryAllItems 끝




// --- 에스크로 관련 함수들 ---

  // ✅ 구매자 확인
  $scope.buyerConfirm = function() {
    console.log("Buyer Confirm button clicked. Escrow Data:", $scope.escrowData);
    const escrowID = $scope.escrowData.id;
    const amount = $scope.escrowData.amount;
    $("#success_escrow_action").hide();
    $("#error_escrow_action").hide();

    if (!escrowID || amount === null || amount === undefined || amount <= 0 || isNaN(amount)) {
      $scope.escrow_action_error = "에스크로 ID와 금액(양수)을 올바르게 입력해주세요.";
      $("#error_escrow_action").show();
      return;
    }

    appFactory.buyerConfirm(escrowID, amount, function(data, status) {
      handleEscrowActionResponse("구매자 확인", data, status);
    });
  };

  // ✅ 판매자 확인
  $scope.sellerConfirm = function() {
    console.log("Seller Confirm button clicked. Escrow Data:", $scope.escrowData);
    const escrowID = $scope.escrowData.id;
    const amount = $scope.escrowData.amount;
    $("#success_escrow_action").hide();
    $("#error_escrow_action").hide();

    if (!escrowID || amount === null || amount === undefined || amount <= 0 || isNaN(amount)) {
      $scope.escrow_action_error = "에스크로 ID와 금액(양수)을 올바르게 입력해주세요.";
      $("#error_escrow_action").show();
      return;
    }

    appFactory.sellerConfirm(escrowID, amount, function(data, status) {
      handleEscrowActionResponse("판매자 확인", data, status);
    });
  };

  // ✅ 거래 최종 완료
  $scope.finalizeEscrow = function() {
    console.log("Finalize Escrow button clicked. Escrow ID:", $scope.escrowData.id);
    const escrowID = $scope.escrowData.id;
    $("#success_escrow_action").hide();
    $("#error_escrow_action").hide();

    if (!escrowID) {
      $scope.escrow_action_error = "에스크로 ID를 입력해주세요.";
      $("#error_escrow_action").show();
      return;
    }

    appFactory.finalizeEscrow(escrowID, function(data, status) {
      handleEscrowActionResponse("거래 최종 완료", data, status);
    });
  };

  // ✅ 에스크로 상태 조회
  $scope.queryEscrow = function() {
    console.log("Query Escrow button clicked. Escrow ID:", $scope.escrowData.id);
    const escrowID = $scope.escrowData.id;
    $("#success_query_escrow").hide();
    $("#error_query_escrow").hide();
    $scope.escrowQueryResult = null; // 이전 결과 초기화

    if (!escrowID) {
      $scope.query_escrow_error = "조회할 에스크로 ID를 입력해주세요.";
      $("#error_query_escrow").show();
      return;
    }

    appFactory.queryEscrow(escrowID, function(data, status) {
      console.log("Response from /escrows/:id (QueryEscrow):", status, data);
      if (status === 200) {
        try {
          let parsedData;
          if (typeof data === 'string') {
             parsedData = JSON.parse(data); // 문자열이면 파싱
          } else {
             parsedData = data; // 이미 객체면 그대로 사용
          }
          $scope.escrowQueryResult = parsedData; // 조회 결과 저장
          // 성공 메시지 대신 결과 표시 영역에 데이터 표시 (pre 태그 사용 등)
          $("#success_query_escrow").show(); // 또는 상세 결과 표시 영역을 보이게 처리
          console.log("Escrow query result:", $scope.escrowQueryResult);
        } catch (e) {
          console.error("Error parsing QueryEscrow result:", e);
          $scope.query_escrow_error = "에스크로 정보 처리 실패: " + e.message;
          $("#error_query_escrow").show();
        }
      } else {
        let errorMsg = "에스크로 조회 실패: ";
        if (data && data.error) {
          errorMsg += data.error;
        } else if (typeof data === 'string' && data.length > 0) {
          errorMsg += data;
        } else {
          errorMsg += `Status ${status}`;
        }
        $scope.query_escrow_error = errorMsg;
        $("#error_query_escrow").show();
      }
       // 다른 섹션 메시지 숨김 ...
    });
  };

  // 에스크로 액션(Confirm, Finalize) 공통 응답 처리 함수
  function handleEscrowActionResponse(actionName, data, status) {
    console.log(`Response from ${actionName}:`, status, data);
    if (status === 200 && (data === "" || (data && data.result === "success"))) {
      $scope.escrow_action_msg = `${actionName} 성공! (Escrow ID: ${$scope.escrowData.id})`;
      $("#success_escrow_action").show();
      // 성공 시 입력 필드 초기화 (선택 사항)
      // $scope.escrowData = { id: '', amount: null };
    } else {
      let errorMsg = `${actionName} 실패: `;
      if (data && data.error) {
        errorMsg += data.error;
      } else if (typeof data === 'string' && data.length > 0) {
        errorMsg += data;
      } else {
        errorMsg += `Status ${status}`;
      }
      $scope.escrow_action_error = errorMsg;
      $("#error_escrow_action").show();
    }
     // 다른 섹션 메시지 숨김 ...
  }


});
app.factory('appFactory', function($http){

    var factory = {};

    factory.initAB = function(data, callback){
        // GET 요청 URL 생성 (aval은 0으로 고정됨)
        // data.a에 trim()을 적용하여 앞뒤 공백 제거
        const id = data.a ? data.a.trim() : '';
        const value = data.aval !== undefined ? data.aval : 0; // aval이 없으면 0 사용

        $http.get('/init?a='+encodeURIComponent(id)+'&aval='+value).success(function(output){
            callback(output);
        }).error(function(error){ // HTTP 요청 실패 시 처리
             console.error("HTTP GET /init 요청 실패:", error);
             callback({ error: "서버 통신 오류" }); // 오류 콜백 호출
        });
    };

    factory.queryAB = function(name, callback){
        $http.get('/query?name='+name)
            .success(function(output){
                // 성공 시 output과 상태코드 200 전달
                callback(output, 200);
            })
            .error(function(output, status){
                // 오류 시 output과 해당 상태코드 전달
                callback(output, status);
            });
    }

       // invoke 팩토리 함수 추가
       factory.invoke = function(data, callback){
        $http.get('/invoke?A='+data.A+'&B='+data.B+'&X='+data.X)
            .success(function(output){ callback(output, 200); })
            .error(function(output, status){ callback(output, status); });
    }

    // delete 팩토리 함수 추가
    factory.deleteAccount = function(name, callback){
        $http.get('/delete?name='+name)
            .success(function(output){ callback(output, 200); })
            .error(function(output, status){ callback(output, status); });
    }


    // queryAll 팩토리 함수 추가
    factory.queryAll = function(callback){
        
        // 주의: server.js 엔드포인트 이름이 '/queryAll' 인지 '/queryall'인지 확인 필요
        // 현재 server.js 에는 '/queryAll'로 되어 있으므로 그대로 사용
        $http.get('/queryAll') // 대소문자 구분 주의
            .success(function(output){ callback(output, 200); })
            .error(function(output, status){ callback(output, status); });
    }

        // --- 새로운 팩토리 함수: 돈 충전 ---
        factory.depositMoney = function(data, callback){
            const id = data.id ? data.id.trim() : '';
            const amount = data.amount;
    
            // id와 amount 값이 유효한지 한번 더 확인 (컨트롤러에서 했지만 안전하게)
            if (!id || amount === undefined || amount === null || amount <= 0) {
                 // 실제 요청을 보내지 않고 오류 콜백 호출
                 // status 400은 임의로 지정 (클라이언트 측 오류)
                 callback({ error: "Invalid ID or amount provided to factory." }, 400);
                 return;
            }
    
            // GET 요청으로 /deposit 엔드포인트 호출
            $http.get('/deposit?id='+encodeURIComponent(id)+'&amount='+amount)
                .success(function(output){ callback(output, 200); }) // 성공 시
                .error(function(output, status){ callback(output, status); }); // 실패 시
        };



    // --- 새로운 팩토리 함수: 돈 출금 ---
    factory.withdrawMoney = function(data, callback){
        const id = data.id ? data.id.trim() : '';
        const amount = data.amount;

        // 간단한 유효성 검증 (선택 사항)
        if (!id || amount === undefined || amount === null || amount <= 0) {
             callback({ error: "Invalid ID or amount provided to withdraw factory." }, 400);
             return;
        }

        // GET 요청으로 /withdraw 엔드포인트 호출 (서버에 해당 엔드포인트 필요)
        $http.get('/withdraw?id='+encodeURIComponent(id)+'&amount='+amount)
            .success(function(output){ callback(output, 200); }) // 성공 시
            .error(function(output, status){ callback(output, status); }); // 실패 시
    };

    // --- 새로운 팩토리 함수: 상품 등록 ---
    factory.createItem = function(data, callback){
        const { id, name, price, seller } = data;

        // 간단한 유효성 검증 (컨트롤러에서 했지만 추가 가능)
        if (!id || !name || price === undefined || price === null || price <= 0 || !seller) {
             callback({ error: "Invalid item data provided to factory." }, 400);
             return;
        }

        // GET 요청으로 /items 엔드포인트 호출
        const url = `/items?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&price=${price}&seller=${encodeURIComponent(seller)}`;
        $http.get(url)
            .success(function(output){ callback(output, 200); }) // 성공 시
            .error(function(output, status){ callback(output, status); }); // 실패 시
    };


    factory.queryAllItems = function(callback){
        // 서버에 '/items/all' 엔드포인트 필요
        $http.get('/items/all')
            .success(function(output){ callback(output, 200); }) // 성공 시
            .error(function(output, status){ callback(output, status); }); // 실패 시
    };


        // ✅ 구매자 확인
        factory.buyerConfirm = function(escrowId, amount, callback) {
            const url = `/escrows/${encodeURIComponent(escrowId)}/buyer-confirm?amount=${amount}`;
            $http.get(url)
              .success(function(output){ callback(output, 200); })
              .error(function(output, status){ callback(output, status); });
          };
      
          // ✅ 판매자 확인
          factory.sellerConfirm = function(escrowId, amount, callback) {
            const url = `/escrows/${encodeURIComponent(escrowId)}/seller-confirm?amount=${amount}`;
            $http.get(url)
              .success(function(output){ callback(output, 200); })
              .error(function(output, status){ callback(output, status); });
          };
      
          // ✅ 거래 최종 완료
          factory.finalizeEscrow = function(escrowId, callback) {
            const url = `/escrows/${encodeURIComponent(escrowId)}/finalize`;
            $http.get(url)
              .success(function(output){ callback(output, 200); })
              .error(function(output, status){ callback(output, status); });
          };
      
          // ✅ 에스크로 상태 조회
          factory.queryEscrow = function(escrowId, callback) {
            const url = `/escrows/${encodeURIComponent(escrowId)}`;
            $http.get(url)
              .success(function(output){ callback(output, 200); })
              .error(function(output, status){ callback(output, status); });
          };
      
    return factory;
 });